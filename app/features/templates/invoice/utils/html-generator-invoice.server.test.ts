import { describe, expect, test } from "vitest";

import type { TemplateSection } from "../../shared/types";
import {
  generateInvoiceExportHTML,
  generateInvoicePreviewHTML,
} from "./html-generator-invoice.server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createSection = (
  overrides: Partial<TemplateSection>,
): TemplateSection => ({
  id: "section-1",
  type: "invoice-header",
  order: 0,
  data: {},
  styles: {},
  ...overrides,
});

// ---------------------------------------------------------------------------
// renderInvoiceSectionToHTML (tested via generateInvoicePreviewHTML)
// ---------------------------------------------------------------------------

describe("Invoice HTML Generation – Section Rendering", () => {
  describe("invoice-header section", () => {
    test("given: full header data, should: render company info, invoice metadata, and billing addresses", () => {
      const section = createSection({
        type: "invoice-header",
        data: {
          companyName: "Acme Corp",
          companyAddress: "123 Business St",
          companyEmail: "info@acme.com",
          companyPhone: "+1-555-0100",
          invoiceNumber: "INV-001",
          invoiceDate: "2024-01-15",
          dueDate: "2024-02-15",
          billToName: "Jane Smith",
          billToAddress: "456 Client Ave",
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("Acme Corp");
      expect(html).toContain("123 Business St");
      expect(html).toContain("info@acme.com");
      expect(html).toContain("+1-555-0100");
      expect(html).toContain("INV-001");
      expect(html).toContain("2024-01-15");
      expect(html).toContain("2024-02-15");
      expect(html).toContain("Bill To:");
      expect(html).toContain("Jane Smith");
      expect(html).toContain("456 Client Ave");
      expect(html).toContain("INVOICE");
    });

    test("given: header with company logo, should: render the logo image", () => {
      const section = createSection({
        type: "invoice-header",
        data: { companyLogo: "https://example.com/logo.png" },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain('src="https://example.com/logo.png"');
      expect(html).toContain("invoice-company-logo");
    });

    test("given: header without company logo, should: not render an img tag for the logo", () => {
      const section = createSection({
        type: "invoice-header",
        data: { companyName: "Test" },
      });

      const html = generateInvoicePreviewHTML([section], {});

      // CSS always contains .invoice-company-logo, so check for actual <img> tag
      expect(html).not.toContain("<img src=");
    });

    test("given: header with ship-to data, should: render the ship-to section", () => {
      const section = createSection({
        type: "invoice-header",
        data: {
          shipToName: "Warehouse Inc",
          shipToAddress: "789 Warehouse Rd",
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("Ship To:");
      expect(html).toContain("Warehouse Inc");
      expect(html).toContain("789 Warehouse Rd");
    });

    test("given: header without ship-to data, should: not render the ship-to section", () => {
      const section = createSection({
        type: "invoice-header",
        data: { companyName: "Test" },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).not.toContain("Ship To:");
    });

    test("given: missing optional fields, should: not render them", () => {
      const section = createSection({
        type: "invoice-header",
        data: { companyName: "Test" },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).not.toContain("Invoice #:");
      expect(html).not.toContain("Date:");
      expect(html).not.toContain("Due Date:");
    });
  });

  describe("invoice-items section", () => {
    test("given: items, should: render a table with description, quantity, unit price, and total", () => {
      const section = createSection({
        type: "invoice-items",
        data: {
          items: [
            {
              description: "Web Development",
              quantity: "10",
              unitPrice: "100.00",
              total: "1000.00",
            },
          ],
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("invoice-items-table");
      expect(html).toContain("Web Development");
      expect(html).toContain("10");
      expect(html).toContain("$100.00");
      expect(html).toContain("$1,000.00");
    });

    test("given: empty items array, should: render 'No items' placeholder", () => {
      const section = createSection({
        type: "invoice-items",
        data: { items: [] },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("No items");
      expect(html).toContain("invoice-empty");
    });

    test("given: items is not an array, should: render 'No items' (treated as empty)", () => {
      const section = createSection({
        type: "invoice-items",
        data: { items: "invalid" },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("No items");
    });

    test("given: items with EUR currency, should: format amounts in EUR", () => {
      const section = createSection({
        type: "invoice-items",
        data: {
          items: [
            {
              description: "Service",
              quantity: "1",
              unitPrice: "500.00",
              total: "500.00",
            },
          ],
        },
      });

      const html = generateInvoicePreviewHTML([section], { currency: "EUR" });

      expect(html).toContain("€");
      expect(html).toContain("500.00");
    });
  });

  describe("invoice-footer section", () => {
    test("given: footer with subtotal, tax, discount, and total, should: render all amounts", () => {
      const section = createSection({
        type: "invoice-footer",
        data: {
          subtotal: "1000.00",
          taxRate: "10",
          taxAmount: "100.00",
          taxMode: "percentage",
          discount: "50.00",
          discountRate: "5",
          discountMode: "percentage",
          total: "1050.00",
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("Subtotal:");
      expect(html).toContain("$1,000.00");
      expect(html).toContain("Tax (10%):");
      expect(html).toContain("$100.00");
      expect(html).toContain("Discount (5%):");
      expect(html).toContain("$50.00");
      expect(html).toContain("Total:");
      expect(html).toContain("$1,050.00");
    });

    test("given: zero tax and zero discount, should: not render tax and discount rows", () => {
      const section = createSection({
        type: "invoice-footer",
        data: {
          subtotal: "500.00",
          taxAmount: "0",
          taxRate: "0",
          taxMode: "percentage",
          discount: "0",
          discountRate: "0",
          discountMode: "percentage",
          total: "500.00",
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("Subtotal:");
      expect(html).toContain("Total:");
      // Tax and discount rows should not appear when values are 0
      const taxLabelCount = (html.match(/Tax \(/g) || []).length;
      expect(taxLabelCount).toBe(0);
      const discountLabelCount = (html.match(/Discount \(/g) || []).length;
      expect(discountLabelCount).toBe(0);
    });

    test("given: tax in amount mode without showTaxRate, should: render 'Tax:' without percentage", () => {
      const section = createSection({
        type: "invoice-footer",
        data: {
          subtotal: "1000.00",
          taxAmount: "75.00",
          taxRate: "7.5",
          taxMode: "amount",
          showTaxRate: false,
          discount: "0",
          discountMode: "percentage",
          total: "1075.00",
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("Tax:");
      expect(html).not.toContain("Tax (7.5%):");
    });

    test("given: footer with payment terms, should: render payment terms", () => {
      const section = createSection({
        type: "invoice-footer",
        data: {
          subtotal: "100",
          taxAmount: "0",
          discount: "0",
          total: "100",
          paymentTerms: "Net 30",
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("Payment Terms:");
      expect(html).toContain("Net 30");
    });

    test("given: footer with notes, should: render notes", () => {
      const section = createSection({
        type: "invoice-footer",
        data: {
          subtotal: "100",
          taxAmount: "0",
          discount: "0",
          total: "100",
          notes: "Thank you for your business",
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain("invoice-notes");
      expect(html).toContain("Thank you for your business");
    });

    test("given: footer without payment terms, should: not render payment terms div", () => {
      const section = createSection({
        type: "invoice-footer",
        data: {
          subtotal: "100",
          taxAmount: "0",
          discount: "0",
          total: "100",
        },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).not.toContain("Payment Terms:");
    });
  });

  describe("unknown section type", () => {
    test("given: an unknown type, should: render section data as JSON", () => {
      const section = createSection({
        type: "header" as TemplateSection["type"],
        data: { custom: "data" },
      });

      const html = generateInvoicePreviewHTML([section], {});

      expect(html).toContain('"custom":"data"');
    });
  });
});

// ---------------------------------------------------------------------------
// generateInvoiceHTML – full document tests
// ---------------------------------------------------------------------------

describe("Invoice HTML Generation – Full Document", () => {
  test("given: sections, should: generate valid HTML structure", () => {
    const sections = [
      createSection({
        type: "invoice-header",
        order: 0,
        data: { companyName: "Test" },
      }),
    ];

    const html = generateInvoicePreviewHTML(sections, {});

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("template-container");
  });

  test("given: preview mode, should: set title to 'Invoice Preview'", () => {
    const html = generateInvoicePreviewHTML(
      [createSection({ type: "invoice-header", data: {} })],
      {},
    );

    expect(html).toContain("<title>Invoice Preview</title>");
  });

  test("given: export mode, should: set title to 'Invoice Export'", () => {
    const html = generateInvoiceExportHTML(
      [createSection({ type: "invoice-header", data: {} })],
      {},
    );

    expect(html).toContain("<title>Invoice Export</title>");
  });

  test("given: export mode, should: use fixed width: 210mm for container", () => {
    const html = generateInvoiceExportHTML(
      [createSection({ type: "invoice-header", data: {} })],
      {},
    );

    expect(html).toContain("width: 210mm");
  });

  test("given: preview mode, should: use max-width for container", () => {
    const html = generateInvoicePreviewHTML(
      [createSection({ type: "invoice-header", data: {} })],
      {},
    );

    expect(html).toContain("max-width: 210mm");
  });

  test("given: global styles with currency, should: use the specified currency", () => {
    const section = createSection({
      type: "invoice-items",
      data: {
        items: [
          {
            description: "Item",
            quantity: "1",
            unitPrice: "100",
            total: "100",
          },
        ],
      },
    });

    const html = generateInvoicePreviewHTML([section], { currency: "GBP" });

    expect(html).toContain("£");
  });

  test("given: sections with different orders, should: sort them by order", () => {
    const sections = [
      createSection({
        id: "footer",
        type: "invoice-footer",
        order: 2,
        data: { subtotal: "0", taxAmount: "0", discount: "0", total: "0" },
      }),
      createSection({
        id: "header",
        type: "invoice-header",
        order: 0,
        data: { companyName: "Test" },
      }),
      createSection({
        id: "items",
        type: "invoice-items",
        order: 1,
        data: { items: [] },
      }),
    ];

    const html = generateInvoicePreviewHTML(sections, {});

    const headerIdx = html.indexOf("section-invoice-header");
    const itemsIdx = html.indexOf("section-invoice-items");
    const footerIdx = html.indexOf("section-invoice-footer");

    expect(headerIdx).toBeLessThan(itemsIdx);
    expect(itemsIdx).toBeLessThan(footerIdx);
  });

  test("given: global styles with textColor, should: apply it to body", () => {
    const html = generateInvoicePreviewHTML(
      [createSection({ type: "invoice-header", data: {} })],
      { textColor: "#333333" },
    );

    expect(html).toContain("color: #333333");
  });

  test("given: HTML special characters in data, should: escape them properly", () => {
    const section = createSection({
      type: "invoice-header",
      data: {
        companyName: 'O\'Reilly & "Associates"',
      },
    });

    const html = generateInvoicePreviewHTML([section], {});

    expect(html).toContain("O&#039;Reilly &amp; &quot;Associates&quot;");
    expect(html).not.toContain("<script>");
  });

  describe("Color handling", () => {
    describe("color palette resolution", () => {
      test("given: section with color palette reference, should: resolve it to actual color", () => {
        const colorPalette = ["#ff0000", "#00ff00", "#0000ff"];
        const section = createSection({
          type: "invoice-header",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: true,
        });

        const html = generateInvoicePreviewHTML([section], {}, colorPalette);

        expect(html).toContain('style="color: #ff0000');
      });

      test("given: section with different palette index, should: resolve to correct color", () => {
        const colorPalette = ["#ff0000", "#00ff00", "#0000ff"];
        const section = createSection({
          type: "invoice-header",
          styles: { color: "$colorPalette[1]" },
          usingGlobalPalette: true,
        });

        const html = generateInvoicePreviewHTML([section], {}, colorPalette);

        expect(html).toContain('style="color: #00ff00');
      });

      test("given: section with section-specific palette, should: use section palette when usingGlobalPalette is false", () => {
        const globalPalette = ["#ff0000", "#00ff00"];
        const sectionPalette = ["#0000ff", "#ffff00"];
        const section = createSection({
          type: "invoice-header",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: false,
          colorPalette: sectionPalette,
        });

        const html = generateInvoicePreviewHTML([section], {}, globalPalette);

        expect(html).toContain('style="color: #0000ff');
      });
    });

    describe("invoice-footer color inheritance", () => {
      test("given: footer with palette color, should: apply color to total values but not labels", () => {
        const colorPalette = ["#1a1a1a"];
        const section = createSection({
          type: "invoice-footer",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: true,
          data: {
            subtotal: "100.00",
            taxAmount: "10.00",
            taxRate: "10",
            taxMode: "percentage",
            discount: "5.00",
            discountRate: "5",
            discountMode: "percentage",
            total: "105.00",
            paymentTerms: "Net 30",
            notes: "Thank you",
          },
        });

        const html = generateInvoicePreviewHTML([section], {}, colorPalette);

        // Total values should inherit color from palette
        expect(html).toContain(
          '.section-invoice-footer[style*="color"] .invoice-total-value',
        );
        expect(html).toContain(
          '.section-invoice-footer[style*="color"] .invoice-total-final',
        );

        // Labels should use fixed gray color (#4b5563)
        expect(html).toContain(".invoice-total-label");
        expect(html).toContain("color: #4b5563");
      });

      test("given: footer with palette color, should: use fixed gray for payment terms and notes", () => {
        const colorPalette = ["#1a1a1a"];
        const section = createSection({
          type: "invoice-footer",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: true,
          data: {
            subtotal: "100.00",
            total: "100.00",
            paymentTerms: "Net 30 days",
            notes: "Payment due within 30 days",
          },
        });

        const html = generateInvoicePreviewHTML([section], {}, colorPalette);

        // Payment terms should use fixed gray
        expect(html).toContain(".invoice-payment-terms");
        expect(html).toMatch(/\.invoice-payment-terms[^}]*color:\s*#4b5563/);

        // Notes should use fixed gray
        expect(html).toContain(".invoice-notes");
        expect(html).toMatch(/\.invoice-notes[^}]*color:\s*#4b5563/);
      });

      test("given: footer without color, should: use default colors", () => {
        const section = createSection({
          type: "invoice-footer",
          styles: {},
          data: {
            subtotal: "100.00",
            total: "100.00",
            paymentTerms: "Net 30",
            notes: "Thank you",
          },
        });

        const html = generateInvoicePreviewHTML([section], {}, []);

        // Labels should still use fixed gray
        expect(html).toMatch(/\.invoice-total-label[^}]*color:\s*#4b5563/);
        expect(html).toMatch(/\.invoice-payment-terms[^}]*color:\s*#4b5563/);
        expect(html).toMatch(/\.invoice-notes[^}]*color:\s*#4b5563/);
      });
    });

    describe("invoice-header color inheritance", () => {
      test("given: header with palette color, should: apply color to section element", () => {
        const colorPalette = ["#2c3e50"];
        const section = createSection({
          type: "invoice-header",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: true,
          data: {
            companyName: "Acme Corp",
            companyEmail: "info@acme.com",
            companyPhone: "+1-555-0100",
          },
        });

        const html = generateInvoicePreviewHTML([section], {}, colorPalette);

        // Section should have the resolved color style applied
        expect(html).toContain('class="section-invoice-header"');
        expect(html).toContain('style="color: #2c3e50');
      });

      test("given: header with background color, should: apply color inheritance to contact fields with opacity", () => {
        const colorPalette = ["#1a1a1a"];
        const section = createSection({
          type: "invoice-header",
          styles: { backgroundColor: "$colorPalette[0]" },
          usingGlobalPalette: true,
          data: {
            companyName: "Acme Corp",
            companyEmail: "info@acme.com",
            companyPhone: "+1-555-0100",
          },
        });

        const html = generateInvoicePreviewHTML([section], {}, colorPalette);

        // Contact fields should inherit color with opacity when background is set
        expect(html).toContain(
          '.section-invoice-header[style*="background"] .invoice-company-contact',
        );
        expect(html).toContain("opacity: 0.9");
      });
    });

    describe("invoice-items color inheritance", () => {
      test("given: items section with palette color, should: apply color to table elements", () => {
        const colorPalette = ["#333333"];
        const section = createSection({
          type: "invoice-items",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: true,
          data: {
            items: [
              {
                description: "Item 1",
                quantity: "1",
                unitPrice: "100.00",
                total: "100.00",
              },
            ],
          },
        });

        const html = generateInvoicePreviewHTML([section], {}, colorPalette);

        // Table elements should inherit color
        expect(html).toContain(
          '.section-invoice-items[style*="color"] .invoice-items-table',
        );
        expect(html).toContain(
          '.section-invoice-items[style*="color"] .invoice-items-table td',
        );
        expect(html).toContain(
          '.section-invoice-items[style*="color"] .invoice-items-table th',
        );
      });
    });
  });
});

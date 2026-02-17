import { describe, expect, test } from "vitest";

import type { TemplateSection } from "../../shared/types";
import {
  generateReceiptExportHTML,
  generateReceiptPreviewHTML,
} from "./html-generator-receipt.server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createSection = (
  overrides: Partial<TemplateSection>,
): TemplateSection => ({
  id: "section-1",
  type: "receipt-header",
  order: 0,
  data: {},
  styles: {},
  ...overrides,
});

// ---------------------------------------------------------------------------
// renderReceiptSectionToHTML (tested via generateReceiptPreviewHTML)
// ---------------------------------------------------------------------------

describe("Receipt HTML Generation – Section Rendering", () => {
  describe("receipt-header section", () => {
    test("given: full header data, should: render store info and receipt metadata", () => {
      const section = createSection({
        type: "receipt-header",
        data: {
          storeName: "Corner Store",
          storeAddress: "100 Main St",
          storeEmail: "store@example.com",
          storePhone: "+1-555-0200",
          receiptNumber: "RCP-001",
          receiptDate: "2024-01-15",
          transactionId: "TXN-12345",
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("Corner Store");
      expect(html).toContain("100 Main St");
      expect(html).toContain("store@example.com");
      expect(html).toContain("+1-555-0200");
      expect(html).toContain("RCP-001");
      expect(html).toContain("2024-01-15");
      expect(html).toContain("TXN-12345");
      expect(html).toContain("RECEIPT");
    });

    test("given: header with store logo, should: render the logo image", () => {
      const section = createSection({
        type: "receipt-header",
        data: { storeLogo: "https://example.com/logo.png" },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain('src="https://example.com/logo.png"');
      expect(html).toContain("receipt-store-logo");
    });

    test("given: header without store logo, should: not render an img tag for the logo", () => {
      const section = createSection({
        type: "receipt-header",
        data: { storeName: "Test" },
      });

      const html = generateReceiptPreviewHTML([section], {});

      // The CSS always contains .receipt-store-logo, but the <img> should not be in the HTML
      expect(html).not.toContain("<img src=");
    });

    test("given: missing optional fields, should: not render them", () => {
      const section = createSection({
        type: "receipt-header",
        data: { storeName: "Test" },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).not.toContain("Receipt #:");
      expect(html).not.toContain("Transaction ID:");
    });
  });

  describe("receipt-items section", () => {
    test("given: items, should: render a table with description, quantity, unit price, and total", () => {
      const section = createSection({
        type: "receipt-items",
        data: {
          items: [
            {
              description: "Coffee",
              quantity: "2",
              unitPrice: "4.50",
              total: "9.00",
            },
            {
              description: "Sandwich",
              quantity: "1",
              unitPrice: "8.00",
              total: "8.00",
            },
          ],
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("receipt-items-table");
      expect(html).toContain("Coffee");
      expect(html).toContain("Sandwich");
      expect(html).toContain("$4.50");
      expect(html).toContain("$9.00");
      expect(html).toContain("$8.00");
    });

    test("given: empty items array, should: render 'No items' placeholder", () => {
      const section = createSection({
        type: "receipt-items",
        data: { items: [] },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("No items");
      expect(html).toContain("receipt-empty");
    });

    test("given: items is not an array, should: render 'No items'", () => {
      const section = createSection({
        type: "receipt-items",
        data: { items: null },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("No items");
    });
  });

  describe("receipt-footer section", () => {
    test("given: footer with subtotal, tax, discount, and total, should: render all amounts", () => {
      const section = createSection({
        type: "receipt-footer",
        data: {
          subtotal: "17.00",
          taxRate: "8.5",
          taxAmount: "1.45",
          taxMode: "percentage",
          discount: "2.00",
          discountRate: "11.76",
          discountMode: "percentage",
          total: "16.45",
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("Subtotal:");
      expect(html).toContain("$17.00");
      expect(html).toContain("Tax (8.5%):");
      expect(html).toContain("$1.45");
      expect(html).toContain("Discount (11.76%):");
      expect(html).toContain("$2.00");
      expect(html).toContain("Total:");
      expect(html).toContain("$16.45");
    });

    test("given: zero tax and zero discount, should: not render tax and discount rows", () => {
      const section = createSection({
        type: "receipt-footer",
        data: {
          subtotal: "50.00",
          taxAmount: "0",
          discount: "0",
          total: "50.00",
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("Subtotal:");
      expect(html).toContain("Total:");
      expect(html).not.toContain("Tax (");
      expect(html).not.toContain("Discount (");
    });

    test("given: footer with payment method, should: render it", () => {
      const section = createSection({
        type: "receipt-footer",
        data: {
          subtotal: "50",
          taxAmount: "0",
          discount: "0",
          total: "50",
          paymentMethod: "Credit Card",
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("Payment Method:");
      expect(html).toContain("Credit Card");
    });

    test("given: footer with transaction ID, should: render it", () => {
      const section = createSection({
        type: "receipt-footer",
        data: {
          subtotal: "50",
          taxAmount: "0",
          discount: "0",
          total: "50",
          transactionId: "TXN-99999",
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("Transaction ID:");
      expect(html).toContain("TXN-99999");
    });

    test("given: footer with thank you message, should: render it", () => {
      const section = createSection({
        type: "receipt-footer",
        data: {
          subtotal: "50",
          taxAmount: "0",
          discount: "0",
          total: "50",
          thankYouMessage: "Thank you for shopping with us!",
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("receipt-thank-you");
      expect(html).toContain("Thank you for shopping with us!");
    });

    test("given: footer without payment method, should: not render it", () => {
      const section = createSection({
        type: "receipt-footer",
        data: {
          subtotal: "50",
          taxAmount: "0",
          discount: "0",
          total: "50",
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).not.toContain("Payment Method:");
    });

    test("given: tax in amount mode with showTaxRate false, should: render 'Tax:' without percentage", () => {
      const section = createSection({
        type: "receipt-footer",
        data: {
          subtotal: "100.00",
          taxAmount: "8.00",
          taxRate: "8",
          taxMode: "amount",
          showTaxRate: false,
          discount: "0",
          total: "108.00",
        },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain("Tax:");
      expect(html).not.toContain("Tax (8%):");
    });
  });

  describe("unknown section type", () => {
    test("given: an unknown type, should: render section data as JSON", () => {
      const section = createSection({
        type: "header" as TemplateSection["type"],
        data: { custom: "value" },
      });

      const html = generateReceiptPreviewHTML([section], {});

      expect(html).toContain('"custom":"value"');
    });
  });
});

// ---------------------------------------------------------------------------
// generateReceiptHTML – full document tests
// ---------------------------------------------------------------------------

describe("Receipt HTML Generation – Full Document", () => {
  test("given: sections, should: generate valid HTML structure", () => {
    const sections = [
      createSection({
        type: "receipt-header",
        order: 0,
        data: { storeName: "Test" },
      }),
    ];

    const html = generateReceiptPreviewHTML(sections, {});

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("template-container");
  });

  test("given: preview mode, should: set title to 'Receipt Preview'", () => {
    const html = generateReceiptPreviewHTML(
      [createSection({ type: "receipt-header", data: {} })],
      {},
    );

    expect(html).toContain("<title>Receipt Preview</title>");
  });

  test("given: export mode, should: set title to 'Receipt Export'", () => {
    const html = generateReceiptExportHTML(
      [createSection({ type: "receipt-header", data: {} })],
      {},
    );

    expect(html).toContain("<title>Receipt Export</title>");
  });

  test("given: export mode, should: use fixed width for container", () => {
    const html = generateReceiptExportHTML(
      [createSection({ type: "receipt-header", data: {} })],
      {},
    );

    expect(html).toContain("width: 210mm");
  });

  test("given: preview mode, should: use max-width for container", () => {
    const html = generateReceiptPreviewHTML(
      [createSection({ type: "receipt-header", data: {} })],
      {},
    );

    expect(html).toContain("max-width: 210mm");
  });

  test("given: global styles with currency, should: use the specified currency", () => {
    const section = createSection({
      type: "receipt-items",
      data: {
        items: [
          { description: "Item", quantity: "1", unitPrice: "10", total: "10" },
        ],
      },
    });

    const html = generateReceiptPreviewHTML([section], { currency: "EUR" });

    expect(html).toContain("€");
  });

  test("given: sections with different orders, should: sort them by order", () => {
    const sections = [
      createSection({
        id: "footer",
        type: "receipt-footer",
        order: 2,
        data: { subtotal: "0", taxAmount: "0", discount: "0", total: "0" },
      }),
      createSection({
        id: "header",
        type: "receipt-header",
        order: 0,
        data: { storeName: "Test" },
      }),
      createSection({
        id: "items",
        type: "receipt-items",
        order: 1,
        data: { items: [] },
      }),
    ];

    const html = generateReceiptPreviewHTML(sections, {});

    const headerIdx = html.indexOf("section-receipt-header");
    const itemsIdx = html.indexOf("section-receipt-items");
    const footerIdx = html.indexOf("section-receipt-footer");

    expect(headerIdx).toBeLessThan(itemsIdx);
    expect(itemsIdx).toBeLessThan(footerIdx);
  });

  test("given: global styles with textColor, should: apply it to body", () => {
    const html = generateReceiptPreviewHTML(
      [createSection({ type: "receipt-header", data: {} })],
      { textColor: "#444444" },
    );

    expect(html).toContain("color: #444444");
  });

  test("given: HTML special characters in data, should: escape them", () => {
    const section = createSection({
      type: "receipt-header",
      data: {
        storeName: 'Bob\'s <Store> & "Grill"',
      },
    });

    const html = generateReceiptPreviewHTML([section], {});

    expect(html).toContain("Bob&#039;s &lt;Store&gt; &amp; &quot;Grill&quot;");
  });

  describe("Color handling", () => {
    describe("color palette resolution", () => {
      test("given: section with color palette reference, should: resolve it to actual color", () => {
        const colorPalette = ["#ff0000", "#00ff00", "#0000ff"];
        const section = createSection({
          type: "receipt-header",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: true,
        });

        const html = generateReceiptPreviewHTML([section], {}, colorPalette);

        expect(html).toContain('style="color: #ff0000');
      });

      test("given: section with section-specific palette, should: use section palette when usingGlobalPalette is false", () => {
        const globalPalette = ["#ff0000", "#00ff00"];
        const sectionPalette = ["#0000ff", "#ffff00"];
        const section = createSection({
          type: "receipt-header",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: false,
          colorPalette: sectionPalette,
        });

        const html = generateReceiptPreviewHTML([section], {}, globalPalette);

        expect(html).toContain('style="color: #0000ff');
      });
    });

    describe("receipt-footer color inheritance", () => {
      test("given: footer with palette color, should: apply color to total values but not labels", () => {
        const colorPalette = ["#1a1a1a"];
        const section = createSection({
          type: "receipt-footer",
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
            paymentMethod: "Credit Card",
            transactionId: "TXN-123",
            thankYouMessage: "Thank you!",
          },
        });

        const html = generateReceiptPreviewHTML([section], {}, colorPalette);

        // Total values should inherit color from palette
        expect(html).toContain(
          '.section-receipt-footer[style*="color"] .receipt-total-value',
        );
        expect(html).toContain(
          '.section-receipt-footer[style*="color"] .receipt-total-final',
        );

        // Labels should use fixed gray color (#4b5563)
        expect(html).toContain(".receipt-total-label");
        expect(html).toContain("color: #4b5563");
      });

      test("given: footer with palette color, should: use fixed gray for payment method, transaction ID, and thank you message", () => {
        const colorPalette = ["#1a1a1a"];
        const section = createSection({
          type: "receipt-footer",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: true,
          data: {
            subtotal: "100.00",
            total: "100.00",
            paymentMethod: "Credit Card",
            transactionId: "TXN-123",
            thankYouMessage: "Thank you for your purchase!",
          },
        });

        const html = generateReceiptPreviewHTML([section], {}, colorPalette);

        // Payment method should use fixed gray
        expect(html).toContain(".receipt-payment-method");
        expect(html).toMatch(/\.receipt-payment-method[^}]*color:\s*#4b5563/);

        // Transaction ID should use fixed gray
        expect(html).toContain(".receipt-transaction-id");
        expect(html).toMatch(/\.receipt-transaction-id[^}]*color:\s*#4b5563/);

        // Thank you message should use fixed gray
        expect(html).toContain(".receipt-thank-you");
        expect(html).toMatch(/\.receipt-thank-you[^}]*color:\s*#4b5563/);
      });

      test("given: footer without color, should: use default colors", () => {
        const section = createSection({
          type: "receipt-footer",
          styles: {},
          data: {
            subtotal: "100.00",
            total: "100.00",
            paymentMethod: "Cash",
            transactionId: "TXN-456",
            thankYouMessage: "Thanks!",
          },
        });

        const html = generateReceiptPreviewHTML([section], {}, []);

        // All footer text should use fixed gray
        expect(html).toMatch(/\.receipt-total-label[^}]*color:\s*#4b5563/);
        expect(html).toMatch(/\.receipt-payment-method[^}]*color:\s*#4b5563/);
        expect(html).toMatch(/\.receipt-transaction-id[^}]*color:\s*#4b5563/);
        expect(html).toMatch(/\.receipt-thank-you[^}]*color:\s*#4b5563/);
      });
    });

    describe("receipt-items color inheritance", () => {
      test("given: items section with palette color, should: apply color to table elements", () => {
        const colorPalette = ["#333333"];
        const section = createSection({
          type: "receipt-items",
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: true,
          data: {
            items: [
              {
                description: "Product 1",
                quantity: "1",
                unitPrice: "50.00",
                total: "50.00",
              },
            ],
          },
        });

        const html = generateReceiptPreviewHTML([section], {}, colorPalette);

        // Table elements should inherit color
        expect(html).toContain(
          '.section-receipt-items[style*="color"] .receipt-items-table',
        );
        expect(html).toContain(
          '.section-receipt-items[style*="color"] .receipt-items-table td',
        );
        expect(html).toContain(
          '.section-receipt-items[style*="color"] .receipt-items-table th',
        );
      });
    });
  });
});

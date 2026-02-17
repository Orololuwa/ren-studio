import { describe, expect, test, vi } from "vitest";

import type { Template, TemplateSection } from "../types";
import { handleExportRequest } from "./export-handler.server";

// Mock the PDF generator to avoid launching a real browser
vi.mock("./pdf-generator.server", () => ({
  generatePDF: vi.fn().mockResolvedValue(Buffer.from("mock-pdf-content")),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createSection = (
  overrides: Partial<TemplateSection>,
): TemplateSection => ({
  id: "section-1",
  type: "header",
  order: 0,
  data: {},
  styles: {},
  ...overrides,
});

const createTemplate = (overrides: Partial<Template> = {}): Template => ({
  id: "tpl-1",
  name: "Test Resume",
  type: "resume",
  organizationId: "org-1",
  sections: [
    createSection({
      id: "header-1",
      type: "header",
      order: 0,
      data: { name: "John Doe", title: "Developer" },
    }),
  ],
  globalStyles: {},
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  colorPalette: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Resume Export Integration
// ---------------------------------------------------------------------------

describe("Export Handler Integration – Resume", () => {
  test("given: a resume template with pdf format, should: return PDF response", async () => {
    const template = createTemplate();

    const { response } = await handleExportRequest({ template, format: "pdf" });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      "Test Resume.pdf",
    );
  });

  test("given: default format, should: return PDF response", async () => {
    const template = createTemplate();

    const { response } = await handleExportRequest({ template });

    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });

  test("given: json format, should: return JSON response with base64 PDF", async () => {
    const template = createTemplate();

    const { response } = await handleExportRequest({
      template,
      format: "json",
    });

    expect(response.headers.get("Content-Type")).toBe("application/json");

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.pdf).toBeDefined();
    expect(typeof body.data.pdf).toBe("string");
  });

  test("given: a resume with section overrides, should: use the merged data in export", async () => {
    const { generatePDF } = await import("./pdf-generator.server");

    const template = createTemplate();

    await handleExportRequest({
      template,
      sections: {
        "header-1": { name: "Jane Smith", title: "Designer" },
      },
    });

    // Verify generatePDF was called with HTML containing the overridden data
    expect(generatePDF).toHaveBeenCalled();
    const htmlArg = (generatePDF as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    )?.[0] as string;
    expect(htmlArg).toContain("Jane Smith");
    expect(htmlArg).toContain("Designer");
  });

  test("given: a template with no name, should: use default filename", async () => {
    const template = createTemplate({ name: "" });

    const { response } = await handleExportRequest({ template });

    expect(response.headers.get("Content-Disposition")).toContain(
      "template.pdf",
    );
  });
});

// ---------------------------------------------------------------------------
// Invoice Export Integration
// ---------------------------------------------------------------------------

describe("Export Handler Integration – Invoice", () => {
  test("given: an invoice template, should: generate PDF with correct content", async () => {
    const { generatePDF } = await import("./pdf-generator.server");

    const template = createTemplate({
      name: "Invoice 001",
      type: "invoice",
      sections: [
        createSection({
          id: "inv-header",
          type: "invoice-header",
          order: 0,
          data: { companyName: "Acme Corp", invoiceNumber: "INV-001" },
        }),
        createSection({
          id: "inv-items",
          type: "invoice-items",
          order: 1,
          data: {
            items: [
              {
                description: "Service",
                quantity: "1",
                unitPrice: "500",
                total: "500",
              },
            ],
          },
        }),
        createSection({
          id: "inv-footer",
          type: "invoice-footer",
          order: 2,
          data: {
            subtotal: "500",
            taxAmount: "50",
            taxRate: "10",
            taxMode: "percentage",
            discount: "0",
            discountRate: "0",
            discountMode: "percentage",
            total: "550",
          },
        }),
      ],
      globalStyles: {},
    });

    const { response } = await handleExportRequest({ template });

    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      "Invoice 001.pdf",
    );

    // Verify the HTML passed to PDF generator contains expected content
    const htmlArg = (generatePDF as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    )?.[0] as string;
    expect(htmlArg).toContain("Acme Corp");
    expect(htmlArg).toContain("INV-001");
    expect(htmlArg).toContain("Service");
    expect(htmlArg).toContain("$500.00");
  });

  test("given: an invoice with EUR currency, should: format amounts in EUR in the HTML", async () => {
    const { generatePDF } = await import("./pdf-generator.server");

    const template = createTemplate({
      type: "invoice",
      globalStyles: { currency: "EUR" },
      sections: [
        createSection({
          id: "inv-items",
          type: "invoice-items",
          order: 0,
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
        }),
      ],
    });

    await handleExportRequest({ template });

    const htmlArg = (generatePDF as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    )?.[0] as string;
    expect(htmlArg).toContain("€");
  });
});

// ---------------------------------------------------------------------------
// Receipt Export Integration
// ---------------------------------------------------------------------------

describe("Export Handler Integration – Receipt", () => {
  test("given: a receipt template, should: generate PDF with correct content", async () => {
    const { generatePDF } = await import("./pdf-generator.server");

    const template = createTemplate({
      name: "Receipt 001",
      type: "receipt",
      sections: [
        createSection({
          id: "rcp-header",
          type: "receipt-header",
          order: 0,
          data: { storeName: "Coffee Shop", receiptNumber: "RCP-001" },
        }),
        createSection({
          id: "rcp-items",
          type: "receipt-items",
          order: 1,
          data: {
            items: [
              {
                description: "Latte",
                quantity: "2",
                unitPrice: "5",
                total: "10",
              },
            ],
          },
        }),
        createSection({
          id: "rcp-footer",
          type: "receipt-footer",
          order: 2,
          data: {
            subtotal: "10",
            taxAmount: "0.80",
            taxRate: "8",
            taxMode: "percentage",
            discount: "0",
            discountRate: "0",
            discountMode: "percentage",
            total: "10.80",
            paymentMethod: "Cash",
            thankYouMessage: "Thank you!",
          },
        }),
      ],
      globalStyles: {},
    });

    const { response } = await handleExportRequest({ template });

    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      "Receipt 001.pdf",
    );

    // Verify the HTML passed to PDF generator contains expected content
    const htmlArg = (generatePDF as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    )?.[0] as string;
    expect(htmlArg).toContain("Coffee Shop");
    expect(htmlArg).toContain("Latte");
    expect(htmlArg).toContain("Cash");
    expect(htmlArg).toContain("Thank you!");
  });

  test("given: section data overrides, should: use merged data in the export", async () => {
    const { generatePDF } = await import("./pdf-generator.server");

    const template = createTemplate({
      type: "receipt",
      sections: [
        createSection({
          id: "rcp-header",
          type: "receipt-header",
          order: 0,
          data: { storeName: "Old Store" },
        }),
      ],
    });

    await handleExportRequest({
      template,
      sections: {
        "rcp-header": { storeName: "New Store" },
      },
    });

    const htmlArg = (generatePDF as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    )?.[0] as string;
    expect(htmlArg).toContain("New Store");
    expect(htmlArg).not.toContain("Old Store");
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe("Export Handler Integration – Error Handling", () => {
  test("given: a PDF generation failure, should: return error response", async () => {
    const { generatePDF } = await import("./pdf-generator.server");
    (generatePDF as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Browser crashed"),
    );

    const template = createTemplate();

    const { response } = await handleExportRequest({ template });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("export_generation_failed");
    expect(body.error.message).toContain("Browser crashed");
  });
});

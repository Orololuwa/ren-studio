import { describe, expect, test } from "vitest";

import type { Template, TemplateSection } from "../types";
import { handlePreviewRequest } from "./preview-handler.server";

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
  name: "Test Template",
  type: "resume",
  organizationId: "org-1",
  sections: [
    createSection({
      id: "header-1",
      type: "header",
      order: 0,
      data: { name: "John Doe", title: "Developer" },
    }),
    createSection({
      id: "summary-1",
      type: "summary",
      order: 1,
      data: { content: "<p>Experienced developer</p>" },
    }),
  ],
  globalStyles: {},
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  colorPalette: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Resume Preview Integration
// ---------------------------------------------------------------------------

describe("Preview Handler Integration – Resume", () => {
  test("given: a resume template with no section overrides, should: return HTML response with original data", async () => {
    const template = createTemplate();

    const { response } = await handlePreviewRequest({ template });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html");

    const html = await response.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("John Doe");
    expect(html).toContain("Developer");
    expect(html).toContain("Experienced developer");
  });

  test("given: a resume template with section data overrides, should: merge provided data into HTML", async () => {
    const template = createTemplate();

    const { response } = await handlePreviewRequest({
      template,
      sections: {
        "header-1": { name: "Jane Smith", title: "Designer" },
      },
    });

    const html = await response.text();
    expect(html).toContain("Jane Smith");
    expect(html).toContain("Designer");
    // Summary should keep its original content
    expect(html).toContain("Experienced developer");
  });

  test("given: format=json, should: return JSON response with HTML in data.html", async () => {
    const template = createTemplate();

    const { response } = await handlePreviewRequest({
      template,
      format: "json",
    });

    expect(response.headers.get("Content-Type")).toBe("application/json");

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.html).toContain("<!DOCTYPE html>");
    expect(body.data.html).toContain("John Doe");
  });

  test("given: format=html (default), should: return raw HTML response", async () => {
    const template = createTemplate();

    const { response } = await handlePreviewRequest({ template });

    expect(response.headers.get("Content-Type")).toBe("text/html");
    const html = await response.text();
    expect(html).toContain("<!DOCTYPE html>");
  });

  test("given: resume sections with rich text containing &nbsp;, should: sanitize &nbsp; in the output", async () => {
    const template = createTemplate({
      sections: [
        createSection({
          id: "summary-1",
          type: "summary",
          order: 0,
          data: { content: "self&nbsp;-taught developer" },
        }),
      ],
    });

    const { response } = await handlePreviewRequest({ template });
    const html = await response.text();

    // The sanitizeQuillHtml function should have replaced &nbsp;- with a regular space
    expect(html).not.toContain("&nbsp;-");
  });

  test("given: sections with multiple types, should: sort them by order in the HTML output", async () => {
    const template = createTemplate({
      sections: [
        createSection({
          id: "exp-1",
          type: "experience",
          order: 2,
          data: { entries: [] },
        }),
        createSection({
          id: "header-1",
          type: "header",
          order: 0,
          data: { name: "Test" },
        }),
        createSection({
          id: "skills-1",
          type: "skills",
          order: 1,
          data: { items: ["React"] },
        }),
      ],
    });

    const { response } = await handlePreviewRequest({ template });
    const html = await response.text();

    // Use actual HTML element selectors to avoid matching CSS class definitions
    const headerIdx = html.indexOf('<section class="section-header"');
    const skillsIdx = html.indexOf('<section class="section-skills"');
    const expIdx = html.indexOf('<section class="section-experience"');

    expect(headerIdx).toBeGreaterThan(-1);
    expect(skillsIdx).toBeGreaterThan(-1);
    expect(expIdx).toBeGreaterThan(-1);
    expect(headerIdx).toBeLessThan(skillsIdx);
    expect(skillsIdx).toBeLessThan(expIdx);
  });
});

// ---------------------------------------------------------------------------
// Invoice Preview Integration
// ---------------------------------------------------------------------------

describe("Preview Handler Integration – Invoice", () => {
  test("given: an invoice template, should: return HTML with correct structure and currency formatting", async () => {
    const template = createTemplate({
      type: "invoice",
      sections: [
        createSection({
          id: "inv-header",
          type: "invoice-header",
          order: 0,
          data: {
            companyName: "Acme Corp",
            invoiceNumber: "INV-001",
            billToName: "Client Inc",
          },
        }),
        createSection({
          id: "inv-items",
          type: "invoice-items",
          order: 1,
          data: {
            items: [
              {
                description: "Consulting",
                quantity: "5",
                unitPrice: "200.00",
                total: "1000.00",
              },
            ],
          },
        }),
        createSection({
          id: "inv-footer",
          type: "invoice-footer",
          order: 2,
          data: {
            subtotal: "1000.00",
            taxRate: "10",
            taxAmount: "100.00",
            taxMode: "percentage",
            discount: "0",
            discountRate: "0",
            discountMode: "percentage",
            total: "1100.00",
          },
        }),
      ],
      globalStyles: {},
    });

    const { response } = await handlePreviewRequest({ template });
    const html = await response.text();

    expect(html).toContain("Acme Corp");
    expect(html).toContain("INV-001");
    expect(html).toContain("Consulting");
    expect(html).toContain("$1,000.00");
    expect(html).toContain("Subtotal:");
    expect(html).toContain("Tax (10%):");
    expect(html).toContain("Total:");
    expect(html).toContain("$1,100.00");
  });

  test("given: an invoice template with section overrides, should: merge overrides into output", async () => {
    const template = createTemplate({
      type: "invoice",
      sections: [
        createSection({
          id: "inv-header",
          type: "invoice-header",
          order: 0,
          data: { companyName: "Original" },
        }),
      ],
    });

    const { response } = await handlePreviewRequest({
      template,
      sections: {
        "inv-header": { companyName: "Updated Corp" },
      },
    });

    const html = await response.text();
    expect(html).toContain("Updated Corp");
    expect(html).not.toContain("Original");
  });

  test("given: an invoice with empty items, should: render 'No items' placeholder", async () => {
    const template = createTemplate({
      type: "invoice",
      sections: [
        createSection({
          id: "inv-items",
          type: "invoice-items",
          order: 0,
          data: { items: [] },
        }),
      ],
    });

    const { response } = await handlePreviewRequest({ template });
    const html = await response.text();

    expect(html).toContain("No items");
  });

  test("given: an invoice with EUR currency, should: format amounts in EUR", async () => {
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
                description: "Service",
                quantity: "1",
                unitPrice: "500",
                total: "500",
              },
            ],
          },
        }),
      ],
    });

    const { response } = await handlePreviewRequest({ template });
    const html = await response.text();

    expect(html).toContain("€");
  });
});

// ---------------------------------------------------------------------------
// Receipt Preview Integration
// ---------------------------------------------------------------------------

describe("Preview Handler Integration – Receipt", () => {
  test("given: a receipt template, should: return HTML with correct structure", async () => {
    const template = createTemplate({
      type: "receipt",
      sections: [
        createSection({
          id: "rcp-header",
          type: "receipt-header",
          order: 0,
          data: {
            storeName: "Coffee Shop",
            receiptNumber: "RCP-001",
            receiptDate: "2024-01-15",
          },
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
                unitPrice: "5.00",
                total: "10.00",
              },
            ],
          },
        }),
        createSection({
          id: "rcp-footer",
          type: "receipt-footer",
          order: 2,
          data: {
            subtotal: "10.00",
            taxRate: "8",
            taxAmount: "0.80",
            taxMode: "percentage",
            discount: "0",
            discountRate: "0",
            discountMode: "percentage",
            total: "10.80",
            paymentMethod: "Credit Card",
            transactionId: "TXN-12345",
            thankYouMessage: "Thank you!",
          },
        }),
      ],
      globalStyles: {},
    });

    const { response } = await handlePreviewRequest({ template });
    const html = await response.text();

    expect(html).toContain("Coffee Shop");
    expect(html).toContain("RCP-001");
    expect(html).toContain("Latte");
    expect(html).toContain("$10.00");
    expect(html).toContain("Subtotal:");
    expect(html).toContain("Tax (8%):");
    expect(html).toContain("Total:");
    expect(html).toContain("$10.80");
    expect(html).toContain("Payment Method:");
    expect(html).toContain("Credit Card");
    expect(html).toContain("Transaction ID:");
    expect(html).toContain("TXN-12345");
    expect(html).toContain("Thank you!");
  });

  test("given: a receipt template with section overrides, should: merge overrides", async () => {
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

    const { response } = await handlePreviewRequest({
      template,
      sections: {
        "rcp-header": { storeName: "New Store" },
      },
    });

    const html = await response.text();
    expect(html).toContain("New Store");
    expect(html).not.toContain("Old Store");
  });
});

// ---------------------------------------------------------------------------
// Unsupported template type
// ---------------------------------------------------------------------------

describe("Preview Handler Integration – Unsupported type", () => {
  test("given: an unsupported template type, should: return fallback HTML", async () => {
    const template = createTemplate({
      type: "certificate" as Template["type"],
      sections: [],
    });

    const { response } = await handlePreviewRequest({ template });
    const html = await response.text();

    expect(html).toContain("not yet supported");
  });
});

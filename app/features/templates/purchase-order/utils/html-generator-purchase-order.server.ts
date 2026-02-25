import { formatCurrency } from "../../invoice/utils/currency-formatter";
import type { SectionStyles, TemplateSection } from "../../shared/types";
import {
  getSectionColorPalette,
  resolveStyleColors,
} from "../../shared/utils/color-resolver";
import { sanitizeQuillHtml } from "../../shared/utils/sanitize-quill-html.server";

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "'": "&#039;",
    '"': "&quot;",
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

function objectToCSS(
  styles: SectionStyles,
  colorPalette: string[] = [],
): string {
  const resolvedStyles = resolveStyleColors(
    styles as Record<string, string>,
    colorPalette,
  );
  return Object.entries(resolvedStyles)
    .filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => {
      const cssProperty = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssProperty}: ${value};`;
    })
    .join(" ");
}

function renderPurchaseOrderSectionToHTML(
  section: TemplateSection,
  currency: string = "USD",
  globalColorPalette: string[] = [],
): string {
  const sectionColorPalette = getSectionColorPalette(
    section.usingGlobalPalette,
    section.colorPalette,
    globalColorPalette,
  );
  const inlineStyles = objectToCSS(section.styles, sectionColorPalette);

  switch (section.type) {
    case "purchase-order-header": {
      const logoUrl = section.data.companyLogo as string | undefined;
      return `
        <section class="section-po-header" style="${inlineStyles}">
          <div class="po-header-content">
            <div class="po-company-info">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Company Logo" class="po-company-logo" loading="eager" />` : ""}
              <h1 class="po-company-name">${escapeHtml(String(section.data.companyName || ""))}</h1>
              ${section.data.companyAddress ? `<div class="po-company-address">${escapeHtml(String(section.data.companyAddress)).replace(/\n/g, "<br>")}</div>` : ""}
              ${section.data.companyEmail ? `<div class="po-company-contact">${escapeHtml(String(section.data.companyEmail))}</div>` : ""}
              ${section.data.companyPhone ? `<div class="po-company-contact">${escapeHtml(String(section.data.companyPhone))}</div>` : ""}
            </div>
            <div class="po-meta">
              <h2 class="po-title">PURCHASE ORDER</h2>
              <div class="po-details">
                ${section.data.poNumber ? `<div><span class="po-label">Order #:</span> ${escapeHtml(String(section.data.poNumber))}</div>` : ""}
                ${section.data.orderDate ? `<div><span class="po-label">Order Date:</span> ${escapeHtml(String(section.data.orderDate))}</div>` : ""}
                ${section.data.expectedDelivery ? `<div><span class="po-label">Expected Delivery:</span> ${escapeHtml(String(section.data.expectedDelivery))}</div>` : ""}
              </div>
            </div>
          </div>
          <div class="po-addresses">
            <div class="po-bill-to">
              <h3>Supplier (Bill To):</h3>
              ${section.data.billToName ? `<div class="po-supplier-name">${escapeHtml(String(section.data.billToName))}</div>` : ""}
              ${section.data.billToAddress ? `<div class="po-supplier-address">${escapeHtml(String(section.data.billToAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            ${
              section.data.shipToName
                ? `
            <div class="po-ship-to">
              <h3>Ship To:</h3>
              <div class="po-delivery-name">${escapeHtml(String(section.data.shipToName))}</div>
              ${section.data.shipToAddress ? `<div class="po-delivery-address">${escapeHtml(String(section.data.shipToAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            `
                : ""
            }
          </div>
        </section>
      `;
    }

    case "purchase-order-items": {
      const items = Array.isArray(section.data.items)
        ? (section.data.items as Array<{
            description: string;
            quantity: string;
            unitPrice: string;
            total: string;
          }>)
        : [];
      return `
        <section class="section-po-items" style="${inlineStyles}">
          <table class="po-items-table">
            <thead>
              <tr>
                <th class="po-item-description">Description</th>
                <th class="po-item-quantity">Quantity</th>
                <th class="po-item-price">Unit Price</th>
                <th class="po-item-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length === 0
                  ? `<tr><td colspan="4" class="po-empty">No items</td></tr>`
                  : items
                      .map(
                        (item) => `
                <tr class="po-item-row">
                  <td>${escapeHtml(item.description || "")}</td>
                  <td class="po-item-number">${escapeHtml(item.quantity || "0")}</td>
                  <td class="po-item-number">${escapeHtml(formatCurrency(item.unitPrice, "en-US", currency))}</td>
                  <td class="po-item-number">${escapeHtml(formatCurrency(item.total, "en-US", currency))}</td>
                </tr>
              `,
                      )
                      .join("")
              }
            </tbody>
          </table>
        </section>
      `;
    }

    case "purchase-order-footer": {
      const taxMode = (section.data.taxMode as string) || "percentage";
      const discountMode =
        (section.data.discountMode as string) || "percentage";
      const showTaxRate = section.data.showTaxRate !== false;
      const showDiscountRate = section.data.showDiscountRate !== false;
      const taxRate = Number.parseFloat(String(section.data.taxRate || "0"));
      const discountRate = Number.parseFloat(
        String(section.data.discountRate || "0"),
      );

      return `
        <section class="section-po-footer" style="${inlineStyles}">
          <div class="po-totals">
            <div class="po-totals-wrapper">
              <div class="po-total-row">
                <span class="po-total-label">Subtotal:</span>
                <span class="po-total-value">${escapeHtml(formatCurrency(section.data.subtotal as string | number | undefined, "en-US", currency))}</span>
              </div>
              ${
                Number.parseFloat(String(section.data.taxAmount || "0")) > 0
                  ? `
              <div class="po-total-row">
                <span class="po-total-label">${
                  taxMode === "percentage" ||
                  (taxMode === "amount" && showTaxRate && taxRate > 0)
                    ? `Tax (${escapeHtml(String(section.data.taxRate || "0"))}%):`
                    : "Tax:"
                }</span>
                <span class="po-total-value">${escapeHtml(formatCurrency(section.data.taxAmount as string | number | undefined, "en-US", currency))}</span>
              </div>
              `
                  : ""
              }
              ${
                Number.parseFloat(String(section.data.discount || "0")) > 0
                  ? `
              <div class="po-total-row">
                <span class="po-total-label">${
                  discountMode === "percentage" ||
                  (
                    discountMode === "amount" &&
                      showDiscountRate &&
                      discountRate > 0
                  )
                    ? `Discount (${escapeHtml(String(section.data.discountRate || "0"))}%):`
                    : "Discount:"
                }</span>
                <span class="po-total-value">-${escapeHtml(formatCurrency(section.data.discount as string | number | undefined, "en-US", currency))}</span>
              </div>
              `
                  : ""
              }
              <div class="po-total-row po-total-final">
                <span class="po-total-label">Total:</span>
                <span class="po-total-value">${escapeHtml(formatCurrency(section.data.total as string | number | undefined, "en-US", currency))}</span>
              </div>
            </div>
          </div>
          ${
            section.data.validityPeriod
              ? `<div class="po-validity"><strong>Valid For:</strong> ${escapeHtml(String(section.data.validityPeriod))}</div>`
              : ""
          }
          ${
            section.data.terms
              ? `<div class="po-terms"><strong>Terms:</strong> <div class="rich-text-content">${sanitizeQuillHtml(String(section.data.terms))}</div></div>`
              : ""
          }
        </section>
      `;
    }

    default:
      return `
        <section class="section-${section.type}" style="${inlineStyles}">
          ${JSON.stringify(section.data)}
        </section>
      `;
  }
}

function generatePurchaseOrderHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  isExport: boolean,
  colorPalette: string[] = [],
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const globalCSS = objectToCSS(globalStyles as SectionStyles, colorPalette);
  const currency = (globalStyles.currency as string) || "USD";
  const sectionsHTML = sortedSections
    .map((section) =>
      renderPurchaseOrderSectionToHTML(section, currency, colorPalette),
    )
    .join("\n");

  const textColor = globalStyles.color || globalStyles.textColor || "#000000";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExport ? "Purchase Order Export" : "Purchase Order Preview"}</title>
  <style>
    @page {
      margin: 0;
      size: A4;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }

    body {
      ${globalCSS}
      line-height: 1.6;
      color: ${textColor};
    }

    .template-container {
      ${isExport ? `width: 210mm; margin: 0;` : `max-width: 210mm; margin: 0 auto;`}
      background: white;
      padding: 0;
    }

    .section-po-header { margin-bottom: 2rem; }
    .po-header-content { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .po-company-info { flex: 1; }
    .po-company-logo { max-height: 60px; max-width: 200px; margin-bottom: 1rem; object-fit: contain; }
    .po-company-name { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
    .po-company-address, .po-company-contact { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; white-space: pre-line; }
    .section-po-header[style*="background"] .po-company-address,
    .section-po-header[style*="background"] .po-company-contact,
    .section-po-header[style*="background"] .po-label,
    .section-po-header[style*="background"] .po-supplier-address { color: inherit; opacity: 0.9; }
    .po-meta { text-align: right; }
    .po-title { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
    .po-details { font-size: 0.875rem; }
    .po-details div { margin-bottom: 0.25rem; }
    .po-label { color: #6b7280; }
    .po-addresses { display: flex; justify-content: space-between; margin-top: 2rem; }
    .po-bill-to, .po-ship-to { flex: 1; }
    .po-bill-to h3, .po-ship-to h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .po-supplier-name, .po-delivery-name { font-weight: 500; margin-bottom: 0.25rem; }
    .po-supplier-address, .po-delivery-address { font-size: 0.875rem; color: #6b7280; white-space: pre-line; }
    .section-po-header[style*="background"] h1, .section-po-header[style*="background"] h2,
    .section-po-header[style*="background"] h3, .section-po-header[style*="background"] .po-supplier-name,
    .section-po-header[style*="background"] .po-delivery-name { color: inherit; }
    .section-po-items { margin: 2rem 0; }
    .po-items-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .po-items-table thead { background-color: #f3f4f6; }
    .po-items-table th { padding: 0.75rem; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .po-item-quantity, .po-item-price, .po-item-total { text-align: right; }
    .po-items-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; max-width: 0; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    .po-item-description { max-width: 50%; }
    .po-item-number { text-align: right; }
    .po-empty { text-align: center; color: #9ca3af; padding: 2rem; }
    .section-po-footer { margin-top: 2rem; }
    .po-totals { display: flex; justify-content: flex-end; }
    .po-totals-wrapper { width: 16rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .po-total-row { display: flex; justify-content: space-between; }
    .po-total-label { color: #4b5563; }
    .po-total-value { font-weight: 500; }
    .po-total-final { border-top: 2px solid #d1d5db; padding-top: 0.5rem; margin-top: 0; font-size: 1.125rem; font-weight: bold; }
    .po-validity { margin-top: 1.5rem; font-size: 0.875rem; color: #4b5563; }
    .po-terms { margin-top: 1rem; font-size: 0.875rem; color: #4b5563; white-space: pre-line; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    .section-po-items[style*="color"] .po-items-table,
    .section-po-items[style*="color"] .po-items-table td,
    .section-po-items[style*="color"] .po-items-table th { color: inherit; }
    .section-po-footer[style*="color"] .po-total-value,
    .section-po-footer[style*="color"] .po-total-final { color: inherit; }
    ${
      isExport
        ? `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; orphans: 3; widows: 3; }
      .section-po-header, .section-po-items, .section-po-footer { page-break-inside: auto; break-inside: auto; }
      .po-items-table tbody tr.po-item-row { page-break-inside: avoid; break-inside: avoid; }
      .po-totals-wrapper { page-break-inside: avoid; break-inside: avoid; }
    }
    `
        : `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    `
    }
  </style>
</head>
<body>
  <div class="template-container">
    ${sectionsHTML}
  </div>
</body>
</html>
  `.trim();
}

export function generatePurchaseOrderPreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generatePurchaseOrderHTML(sections, globalStyles, false, colorPalette);
}

export function generatePurchaseOrderExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generatePurchaseOrderHTML(sections, globalStyles, true, colorPalette);
}

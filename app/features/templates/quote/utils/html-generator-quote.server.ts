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

function renderQuoteSectionToHTML(
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
    case "quote-header": {
      const logoUrl = section.data.companyLogo as string | undefined;
      return `
        <section class="section-quote-header" style="${inlineStyles}">
          <div class="quote-header-content">
            <div class="quote-company-info">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Company Logo" class="quote-company-logo" loading="eager" />` : ""}
              <h1 class="quote-company-name">${escapeHtml(String(section.data.companyName || ""))}</h1>
              ${section.data.companyAddress ? `<div class="quote-company-address">${escapeHtml(String(section.data.companyAddress)).replace(/\n/g, "<br>")}</div>` : ""}
              ${section.data.companyEmail ? `<div class="quote-company-contact">${escapeHtml(String(section.data.companyEmail))}</div>` : ""}
              ${section.data.companyPhone ? `<div class="quote-company-contact">${escapeHtml(String(section.data.companyPhone))}</div>` : ""}
            </div>
            <div class="quote-meta">
              <h2 class="quote-title">QUOTE</h2>
              <div class="quote-details">
                ${section.data.quoteNumber ? `<div><span class="quote-label">Quote #:</span> ${escapeHtml(String(section.data.quoteNumber))}</div>` : ""}
                ${section.data.quoteDate ? `<div><span class="quote-label">Date:</span> ${escapeHtml(String(section.data.quoteDate))}</div>` : ""}
                ${section.data.validityDate ? `<div><span class="quote-label">Valid Until:</span> ${escapeHtml(String(section.data.validityDate))}</div>` : ""}
              </div>
            </div>
          </div>
          <div class="quote-addresses">
            <div class="quote-bill-to">
              <h3>Bill To:</h3>
              ${section.data.billToName ? `<div class="quote-client-name">${escapeHtml(String(section.data.billToName))}</div>` : ""}
              ${section.data.billToAddress ? `<div class="quote-client-address">${escapeHtml(String(section.data.billToAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            ${
              section.data.shipToName
                ? `
            <div class="quote-ship-to">
              <h3>Ship To:</h3>
              <div class="quote-client-name">${escapeHtml(String(section.data.shipToName))}</div>
              ${section.data.shipToAddress ? `<div class="quote-client-address">${escapeHtml(String(section.data.shipToAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            `
                : ""
            }
          </div>
        </section>
      `;
    }

    case "quote-items": {
      const items = Array.isArray(section.data.items)
        ? (section.data.items as Array<{
            description: string;
            quantity: string;
            unitPrice: string;
            total: string;
          }>)
        : [];
      return `
        <section class="section-quote-items" style="${inlineStyles}">
          <table class="quote-items-table">
            <thead>
              <tr>
                <th class="quote-item-description">Description</th>
                <th class="quote-item-quantity">Quantity</th>
                <th class="quote-item-price">Unit Price</th>
                <th class="quote-item-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length === 0
                  ? `<tr><td colspan="4" class="quote-empty">No items</td></tr>`
                  : items
                      .map(
                        (item) => `
                <tr class="quote-item-row">
                  <td>${escapeHtml(item.description || "")}</td>
                  <td class="quote-item-number">${escapeHtml(item.quantity || "0")}</td>
                  <td class="quote-item-number">${escapeHtml(formatCurrency(item.unitPrice, "en-US", currency))}</td>
                  <td class="quote-item-number">${escapeHtml(formatCurrency(item.total, "en-US", currency))}</td>
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

    case "quote-footer": {
      const taxMode = (section.data.taxMode as string) || "percentage";
      const discountMode =
        (section.data.discountMode as string) || "percentage";
      const showTaxRate = section.data.showTaxRate !== false;
      const showDiscountRate = section.data.showDiscountRate !== false;
      const taxAmount = Number.parseFloat(
        String(section.data.taxAmount || "0"),
      );
      const discount = Number.parseFloat(String(section.data.discount || "0"));
      const taxRate = Number.parseFloat(String(section.data.taxRate || "0"));
      const discountRate = Number.parseFloat(
        String(section.data.discountRate || "0"),
      );

      return `
        <section class="section-quote-footer" style="${inlineStyles}">
          <div class="quote-totals">
            <div class="quote-totals-wrapper">
              <div class="quote-total-row">
                <span class="quote-total-label">Subtotal:</span>
                <span class="quote-total-value">${escapeHtml(formatCurrency(section.data.subtotal as string | number | undefined, "en-US", currency))}</span>
              </div>
              ${
                taxAmount > 0
                  ? `
              <div class="quote-total-row">
                <span class="quote-total-label">${
                  taxMode === "percentage" ||
                  (taxMode === "amount" && showTaxRate && taxRate > 0)
                    ? `Tax (${escapeHtml(String(section.data.taxRate || "0"))}%):`
                    : "Tax:"
                }</span>
                <span class="quote-total-value">${escapeHtml(formatCurrency(section.data.taxAmount as string | number | undefined, "en-US", currency))}</span>
              </div>
              `
                  : ""
              }
              ${
                discount > 0
                  ? `
              <div class="quote-total-row">
                <span class="quote-total-label">${
                  discountMode === "percentage" ||
                  (
                    discountMode === "amount" &&
                      showDiscountRate &&
                      discountRate > 0
                  )
                    ? `Discount (${escapeHtml(String(section.data.discountRate || "0"))}%):`
                    : "Discount:"
                }</span>
                <span class="quote-total-value">-${escapeHtml(formatCurrency(section.data.discount as string | number | undefined, "en-US", currency))}</span>
              </div>
              `
                  : ""
              }
              <div class="quote-total-row quote-total-final">
                <span class="quote-total-label">Total:</span>
                <span class="quote-total-value">${escapeHtml(formatCurrency(section.data.total as string | number | undefined, "en-US", currency))}</span>
              </div>
            </div>
          </div>
          ${
            section.data.validityPeriod
              ? `<div class="quote-validity"><strong>Valid For:</strong> ${escapeHtml(String(section.data.validityPeriod))}</div>`
              : ""
          }
          ${
            section.data.terms
              ? `<div class="quote-terms"><strong>Terms:</strong> <div class="rich-text-content">${sanitizeQuillHtml(String(section.data.terms))}</div></div>`
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

function generateQuoteHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  isExport: boolean,
  colorPalette: string[] = [],
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const globalCSS = objectToCSS(globalStyles as SectionStyles, colorPalette);
  const currency = (globalStyles.currency as string) || "USD";
  const sectionsHTML = sortedSections
    .map((section) => renderQuoteSectionToHTML(section, currency, colorPalette))
    .join("\n");

  const textColor = globalStyles.color || globalStyles.textColor || "#000000";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExport ? "Quote Export" : "Quote Preview"}</title>
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

    .section-quote-header { margin-bottom: 2rem; }
    .quote-header-content { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .quote-company-info { flex: 1; }
    .quote-company-logo { max-height: 60px; max-width: 200px; margin-bottom: 1rem; object-fit: contain; }
    .quote-company-name { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
    .quote-company-address, .quote-company-contact { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; white-space: pre-line; }
    .section-quote-header[style*="background"] .quote-company-address,
    .section-quote-header[style*="background"] .quote-company-contact,
    .section-quote-header[style*="background"] .quote-label,
    .section-quote-header[style*="background"] .quote-client-address { color: inherit; opacity: 0.9; }
    .quote-meta { text-align: right; }
    .quote-title { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
    .quote-details { font-size: 0.875rem; }
    .quote-details div { margin-bottom: 0.25rem; }
    .quote-label { color: #6b7280; }
    .quote-addresses { display: flex; justify-content: space-between; margin-top: 2rem; }
    .quote-bill-to, .quote-ship-to { flex: 1; }
    .quote-bill-to h3, .quote-ship-to h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .quote-client-name { font-weight: 500; margin-bottom: 0.25rem; }
    .quote-client-address { font-size: 0.875rem; color: #6b7280; white-space: pre-line; }
    .section-quote-header[style*="background"] h1, .section-quote-header[style*="background"] h2,
    .section-quote-header[style*="background"] h3, .section-quote-header[style*="background"] .quote-client-name { color: inherit; }
    .section-quote-items { margin: 2rem 0; }
    .quote-items-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .quote-items-table thead { background-color: #f3f4f6; }
    .quote-items-table th { padding: 0.75rem; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .quote-item-quantity, .quote-item-price, .quote-item-total { text-align: right; }
    .quote-items-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; max-width: 0; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    .quote-item-description { max-width: 50%; }
    .quote-item-number { text-align: right; }
    .quote-empty { text-align: center; color: #9ca3af; padding: 2rem; }
    .section-quote-footer { margin-top: 2rem; }
    .quote-totals { display: flex; justify-content: flex-end; }
    .quote-totals-wrapper { width: 16rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .quote-total-row { display: flex; justify-content: space-between; }
    .quote-total-label { color: #4b5563; }
    .quote-total-value { font-weight: 500; }
    .quote-total-final { border-top: 2px solid #d1d5db; padding-top: 0.5rem; margin-top: 0; font-size: 1.125rem; font-weight: bold; }
    .quote-validity { margin-top: 1.5rem; font-size: 0.875rem; color: #4b5563; }
    .quote-terms { margin-top: 1rem; font-size: 0.875rem; color: #4b5563; white-space: pre-line; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    .section-quote-items[style*="color"] .quote-items-table,
    .section-quote-items[style*="color"] .quote-items-table td,
    .section-quote-items[style*="color"] .quote-items-table th { color: inherit; }
    .section-quote-footer[style*="color"] .quote-total-value,
    .section-quote-footer[style*="color"] .quote-total-final { color: inherit; }
    ${
      isExport
        ? `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; orphans: 3; widows: 3; }
      .section-quote-header, .section-quote-items, .section-quote-footer { page-break-inside: auto; break-inside: auto; }
      .quote-items-table tbody tr.quote-item-row { page-break-inside: avoid; break-inside: avoid; }
      .quote-totals-wrapper { page-break-inside: avoid; break-inside: avoid; }
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

export function generateQuotePreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateQuoteHTML(sections, globalStyles, false, colorPalette);
}

export function generateQuoteExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateQuoteHTML(sections, globalStyles, true, colorPalette);
}

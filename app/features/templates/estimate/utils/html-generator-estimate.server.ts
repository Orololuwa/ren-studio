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

function renderEstimateSectionToHTML(
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
    case "estimate-header": {
      const logoUrl = section.data.companyLogo as string | undefined;
      return `
        <section class="section-estimate-header" style="${inlineStyles}">
          <div class="estimate-header-content">
            <div class="estimate-company-info">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Company Logo" class="estimate-company-logo" loading="eager" />` : ""}
              <h1 class="estimate-company-name">${escapeHtml(String(section.data.companyName || ""))}</h1>
              ${section.data.companyAddress ? `<div class="estimate-company-address">${escapeHtml(String(section.data.companyAddress)).replace(/\n/g, "<br>")}</div>` : ""}
              ${section.data.companyEmail ? `<div class="estimate-company-contact">${escapeHtml(String(section.data.companyEmail))}</div>` : ""}
              ${section.data.companyPhone ? `<div class="estimate-company-contact">${escapeHtml(String(section.data.companyPhone))}</div>` : ""}
            </div>
            <div class="estimate-meta">
              <h2 class="estimate-title">ESTIMATE</h2>
              <div class="estimate-details">
                ${section.data.estimateNumber ? `<div><span class="estimate-label">Estimate #:</span> ${escapeHtml(String(section.data.estimateNumber))}</div>` : ""}
                ${section.data.estimateDate ? `<div><span class="estimate-label">Date:</span> ${escapeHtml(String(section.data.estimateDate))}</div>` : ""}
                ${section.data.validityDate ? `<div><span class="estimate-label">Valid Until:</span> ${escapeHtml(String(section.data.validityDate))}</div>` : ""}
              </div>
            </div>
          </div>
          <div class="estimate-addresses">
            <div class="estimate-bill-to">
              <h3>Bill To:</h3>
              ${section.data.billToName ? `<div class="estimate-client-name">${escapeHtml(String(section.data.billToName))}</div>` : ""}
              ${section.data.billToAddress ? `<div class="estimate-client-address">${escapeHtml(String(section.data.billToAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            ${
              section.data.shipToName
                ? `
            <div class="estimate-ship-to">
              <h3>Ship To:</h3>
              <div class="estimate-client-name">${escapeHtml(String(section.data.shipToName))}</div>
              ${section.data.shipToAddress ? `<div class="estimate-client-address">${escapeHtml(String(section.data.shipToAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            `
                : ""
            }
          </div>
        </section>
      `;
    }

    case "estimate-items": {
      const items = Array.isArray(section.data.items)
        ? (section.data.items as Array<{
            description: string;
            quantity: string;
            unitPrice: string;
            total: string;
          }>)
        : [];
      return `
        <section class="section-estimate-items" style="${inlineStyles}">
          <table class="estimate-items-table">
            <thead>
              <tr>
                <th class="estimate-item-description">Description</th>
                <th class="estimate-item-quantity">Quantity</th>
                <th class="estimate-item-price">Unit Price</th>
                <th class="estimate-item-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length === 0
                  ? `<tr><td colspan="4" class="estimate-empty">No items</td></tr>`
                  : items
                      .map(
                        (item) => `
                <tr class="estimate-item-row">
                  <td>${escapeHtml(item.description || "")}</td>
                  <td class="estimate-item-number">${escapeHtml(item.quantity || "0")}</td>
                  <td class="estimate-item-number">${escapeHtml(formatCurrency(item.unitPrice, "en-US", currency))}</td>
                  <td class="estimate-item-number">${escapeHtml(formatCurrency(item.total, "en-US", currency))}</td>
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

    case "estimate-footer": {
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
        <section class="section-estimate-footer" style="${inlineStyles}">
          <div class="estimate-totals">
            <div class="estimate-totals-wrapper">
              <div class="estimate-total-row">
                <span class="estimate-total-label">Subtotal:</span>
                <span class="estimate-total-value">${escapeHtml(formatCurrency(section.data.subtotal as string | number | undefined, "en-US", currency))}</span>
              </div>
              ${
                taxAmount > 0
                  ? `
              <div class="estimate-total-row">
                <span class="estimate-total-label">${
                  taxMode === "percentage" ||
                  (taxMode === "amount" && showTaxRate && taxRate > 0)
                    ? `Tax (${escapeHtml(String(section.data.taxRate || "0"))}%):`
                    : "Tax:"
                }</span>
                <span class="estimate-total-value">${escapeHtml(formatCurrency(section.data.taxAmount as string | number | undefined, "en-US", currency))}</span>
              </div>
              `
                  : ""
              }
              ${
                discount > 0
                  ? `
              <div class="estimate-total-row">
                <span class="estimate-total-label">${
                  discountMode === "percentage" ||
                  (
                    discountMode === "amount" &&
                      showDiscountRate &&
                      discountRate > 0
                  )
                    ? `Discount (${escapeHtml(String(section.data.discountRate || "0"))}%):`
                    : "Discount:"
                }</span>
                <span class="estimate-total-value">-${escapeHtml(formatCurrency(section.data.discount as string | number | undefined, "en-US", currency))}</span>
              </div>
              `
                  : ""
              }
              <div class="estimate-total-row estimate-total-final">
                <span class="estimate-total-label">Total:</span>
                <span class="estimate-total-value">${escapeHtml(formatCurrency(section.data.total as string | number | undefined, "en-US", currency))}</span>
              </div>
            </div>
          </div>
          ${
            section.data.validityPeriod
              ? `<div class="estimate-validity"><strong>Valid For:</strong> ${escapeHtml(String(section.data.validityPeriod))}</div>`
              : ""
          }
          ${
            section.data.notes
              ? `<div class="estimate-notes"><strong>Notes:</strong> <div class="rich-text-content">${sanitizeQuillHtml(String(section.data.notes))}</div></div>`
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

function generateEstimateHTML(
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
      renderEstimateSectionToHTML(section, currency, colorPalette),
    )
    .join("\n");

  const textColor = globalStyles.color || globalStyles.textColor || "#000000";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExport ? "Estimate Export" : "Estimate Preview"}</title>
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

    .section-estimate-header { margin-bottom: 2rem; }
    .estimate-header-content { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .estimate-company-info { flex: 1; }
    .estimate-company-logo { max-height: 60px; max-width: 200px; margin-bottom: 1rem; object-fit: contain; }
    .estimate-company-name { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
    .estimate-company-address, .estimate-company-contact { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; white-space: pre-line; }
    .section-estimate-header[style*="background"] .estimate-company-address,
    .section-estimate-header[style*="background"] .estimate-company-contact,
    .section-estimate-header[style*="background"] .estimate-label,
    .section-estimate-header[style*="background"] .estimate-client-address { color: inherit; opacity: 0.9; }
    .estimate-meta { text-align: right; }
    .estimate-title { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
    .estimate-details { font-size: 0.875rem; }
    .estimate-details div { margin-bottom: 0.25rem; }
    .estimate-label { color: #6b7280; }
    .estimate-addresses { display: flex; justify-content: space-between; margin-top: 2rem; }
    .estimate-bill-to, .estimate-ship-to { flex: 1; }
    .estimate-bill-to h3, .estimate-ship-to h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .estimate-client-name { font-weight: 500; margin-bottom: 0.25rem; }
    .estimate-client-address { font-size: 0.875rem; color: #6b7280; white-space: pre-line; }
    .section-estimate-header[style*="background"] h1, .section-estimate-header[style*="background"] h2,
    .section-estimate-header[style*="background"] h3, .section-estimate-header[style*="background"] .estimate-client-name { color: inherit; }
    .section-estimate-items { margin: 2rem 0; }
    .estimate-items-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .estimate-items-table thead { background-color: #f3f4f6; }
    .estimate-items-table th { padding: 0.75rem; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .estimate-item-quantity, .estimate-item-price, .estimate-item-total { text-align: right; }
    .estimate-items-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; max-width: 0; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    .estimate-item-description { max-width: 50%; }
    .estimate-item-number { text-align: right; }
    .estimate-empty { text-align: center; color: #9ca3af; padding: 2rem; }
    .section-estimate-footer { margin-top: 2rem; }
    .estimate-totals { display: flex; justify-content: flex-end; }
    .estimate-totals-wrapper { width: 16rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .estimate-total-row { display: flex; justify-content: space-between; }
    .estimate-total-label { color: #4b5563; }
    .estimate-total-value { font-weight: 500; }
    .estimate-total-final { border-top: 2px solid #d1d5db; padding-top: 0.5rem; margin-top: 0; font-size: 1.125rem; font-weight: bold; }
    .estimate-validity { margin-top: 1.5rem; font-size: 0.875rem; color: #4b5563; }
    .estimate-notes { margin-top: 1rem; font-size: 0.875rem; color: #4b5563; white-space: pre-line; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    .section-estimate-items[style*="color"] .estimate-items-table,
    .section-estimate-items[style*="color"] .estimate-items-table td,
    .section-estimate-items[style*="color"] .estimate-items-table th { color: inherit; }
    .section-estimate-footer[style*="color"] .estimate-total-value,
    .section-estimate-footer[style*="color"] .estimate-total-final { color: inherit; }
    ${
      isExport
        ? `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; orphans: 3; widows: 3; }
      .section-estimate-header, .section-estimate-items, .section-estimate-footer { page-break-inside: auto; break-inside: auto; }
      .estimate-items-table tbody tr.estimate-item-row { page-break-inside: avoid; break-inside: avoid; }
      .estimate-totals-wrapper { page-break-inside: avoid; break-inside: avoid; }
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

export function generateEstimatePreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateEstimateHTML(sections, globalStyles, false, colorPalette);
}

export function generateEstimateExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateEstimateHTML(sections, globalStyles, true, colorPalette);
}

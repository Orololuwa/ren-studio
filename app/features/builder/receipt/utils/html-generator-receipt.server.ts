import { formatCurrency } from "../../invoice/utils/currency-formatter";
import type { SectionStyles, TemplateSection } from "../../shared/types";

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

function objectToCSS(styles: SectionStyles): string {
  return Object.entries(styles)
    .filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => {
      const cssProperty = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssProperty}: ${value};`;
    })
    .join(" ");
}

function renderReceiptSectionToHTML(section: TemplateSection): string {
  const inlineStyles = objectToCSS(section.styles);

  switch (section.type) {
    case "receipt-header": {
      const logoUrl = section.data.storeLogo as string | undefined;
      return `
        <section class="section-receipt-header" style="${inlineStyles}">
          <div class="receipt-header-content">
            <div class="receipt-store-info">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Store Logo" class="receipt-store-logo" loading="eager" />` : ""}
              <h1 class="receipt-store-name">${escapeHtml(String(section.data.storeName || ""))}</h1>
              ${section.data.storeAddress ? `<div class="receipt-store-address">${escapeHtml(String(section.data.storeAddress)).replace(/\n/g, "<br>")}</div>` : ""}
              ${section.data.storeEmail ? `<div class="receipt-store-contact">${escapeHtml(String(section.data.storeEmail))}</div>` : ""}
              ${section.data.storePhone ? `<div class="receipt-store-contact">${escapeHtml(String(section.data.storePhone))}</div>` : ""}
            </div>
            <div class="receipt-meta">
              <h2 class="receipt-title">RECEIPT</h2>
              <div class="receipt-details">
                ${section.data.receiptNumber ? `<div><span class="receipt-label">Receipt #:</span> ${escapeHtml(String(section.data.receiptNumber))}</div>` : ""}
                ${section.data.receiptDate ? `<div><span class="receipt-label">Date:</span> ${escapeHtml(String(section.data.receiptDate))}</div>` : ""}
                ${section.data.transactionId ? `<div><span class="receipt-label">Transaction ID:</span> ${escapeHtml(String(section.data.transactionId))}</div>` : ""}
              </div>
            </div>
          </div>
        </section>
      `;
    }

    case "receipt-items": {
      const items = Array.isArray(section.data.items)
        ? (section.data.items as Array<{
            description: string;
            quantity: string;
            unitPrice: string;
            total: string;
          }>)
        : [];
      return `
        <section class="section-receipt-items" style="${inlineStyles}">
          <table class="receipt-items-table">
            <thead>
              <tr>
                <th class="receipt-item-description">Description</th>
                <th class="receipt-item-quantity">Quantity</th>
                <th class="receipt-item-price">Unit Price</th>
                <th class="receipt-item-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length === 0
                  ? `<tr><td colspan="4" class="receipt-empty">No items</td></tr>`
                  : items
                      .map(
                        (item) => `
                <tr class="receipt-item-row">
                  <td>${escapeHtml(item.description || "")}</td>
                  <td class="receipt-item-number">${escapeHtml(item.quantity || "0")}</td>
                  <td class="receipt-item-number">${escapeHtml(formatCurrency(item.unitPrice))}</td>
                  <td class="receipt-item-number">${escapeHtml(formatCurrency(item.total))}</td>
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

    case "receipt-footer": {
      return `
        <section class="section-receipt-footer" style="${inlineStyles}">
          <div class="receipt-totals">
            <div class="receipt-totals-wrapper">
              <div class="receipt-total-row">
                <span class="receipt-total-label">Subtotal:</span>
                <span class="receipt-total-value">${escapeHtml(formatCurrency(section.data.subtotal as string | number | undefined))}</span>
              </div>
              ${
                section.data.taxAmount && Number(section.data.taxAmount) > 0
                  ? `
              <div class="receipt-total-row">
                <span class="receipt-total-label">Tax:</span>
                <span class="receipt-total-value">${escapeHtml(formatCurrency(section.data.taxAmount as string | number | undefined))}</span>
              </div>
              `
                  : ""
              }
              ${
                section.data.discount && Number(section.data.discount) > 0
                  ? `
              <div class="receipt-total-row">
                <span class="receipt-total-label">Discount:</span>
                <span class="receipt-total-value">-${escapeHtml(formatCurrency(section.data.discount as string | number | undefined))}</span>
              </div>
              `
                  : ""
              }
              <div class="receipt-total-row receipt-total-final">
                <span class="receipt-total-label">Total:</span>
                <span class="receipt-total-value">${escapeHtml(formatCurrency(section.data.total as string | number | undefined))}</span>
              </div>
            </div>
          </div>
          ${
            section.data.paymentMethod
              ? `<div class="receipt-payment-method"><strong>Payment Method:</strong> ${escapeHtml(String(section.data.paymentMethod))}</div>`
              : ""
          }
          ${
            section.data.transactionId
              ? `<div class="receipt-transaction-id"><strong>Transaction ID:</strong> ${escapeHtml(String(section.data.transactionId))}</div>`
              : ""
          }
          ${
            section.data.thankYouMessage
              ? `<div class="receipt-thank-you">${escapeHtml(String(section.data.thankYouMessage)).replace(/\n/g, "<br>")}</div>`
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

function generateReceiptHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  isExport: boolean,
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const globalCSS = objectToCSS(globalStyles as SectionStyles);
  const sectionsHTML = sortedSections
    .map((section) => renderReceiptSectionToHTML(section))
    .join("\n");

  // Get text color from global styles (supports both 'color' and 'textColor')
  const textColor = globalStyles.color || globalStyles.textColor || "#000000";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExport ? "Receipt Export" : "Receipt Preview"}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      ${globalCSS}
      line-height: 1.6;
      color: ${textColor};
    }
    
    .template-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 0;
    }
    
    .section-receipt-header {
      margin-bottom: 2rem;
    }
    
    .receipt-header-content {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
    }
    
    .receipt-store-info {
      flex: 1;
    }
    
    .receipt-store-logo {
      max-height: 60px;
      max-width: 200px;
      margin-bottom: 1rem;
      object-fit: contain;
    }
    
    .receipt-store-name {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .receipt-store-address,
    .receipt-store-contact {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
      white-space: pre-line;
    }
    
    /* When header has dark background, inherit text color */
    .section-receipt-header[style*="background"] .receipt-store-address,
    .section-receipt-header[style*="background"] .receipt-store-contact,
    .section-receipt-header[style*="background"] .receipt-label {
      color: inherit;
      opacity: 0.9;
    }
    
    /* When section has color set, use it for text elements */
    .section-receipt-items[style*="color"] .receipt-items-table,
    .section-receipt-items[style*="color"] .receipt-items-table td,
    .section-receipt-items[style*="color"] .receipt-items-table th {
      color: inherit;
    }
    
    .section-receipt-footer[style*="color"] .receipt-total-label,
    .section-receipt-footer[style*="color"] .receipt-payment-method,
    .section-receipt-footer[style*="color"] .receipt-transaction-id,
    .section-receipt-footer[style*="color"] .receipt-thank-you {
      color: inherit;
      opacity: 0.8;
    }
    
    .section-receipt-footer[style*="color"] .receipt-total-value,
    .section-receipt-footer[style*="color"] .receipt-total-final {
      color: inherit;
    }
    
    .receipt-meta {
      text-align: right;
    }
    
    .receipt-title {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    
    .receipt-details {
      font-size: 0.875rem;
    }
    
    .receipt-details div {
      margin-bottom: 0.25rem;
    }
    
    .receipt-label {
      color: #6b7280;
    }
    
    /* Ensure text is visible on dark header backgrounds */
    .section-receipt-header[style*="background"] h1,
    .section-receipt-header[style*="background"] h2,
    .section-receipt-header[style*="background"] h3 {
      color: inherit;
    }
    
    .section-receipt-items {
      margin: 2rem 0;
    }
    
    .receipt-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    
    .receipt-items-table thead {
      background-color: #f3f4f6;
    }
    
    /* Darker header for professional template */
    .section-receipt-items[style*="background-color: #ffffff"] .receipt-items-table thead {
      background-color: #f1f5f9;
    }
    
    .receipt-items-table th {
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .receipt-item-quantity,
    .receipt-item-price,
    .receipt-item-total {
      text-align: right;
    }
    
    .receipt-items-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .receipt-item-number {
      text-align: right;
    }
    
    .receipt-empty {
      text-align: center;
      color: #9ca3af;
      padding: 2rem;
    }
    
    .section-receipt-footer {
      margin-top: 2rem;
    }
    
    .receipt-totals {
      display: flex;
      justify-content: flex-end;
    }
    
    .receipt-totals-wrapper {
      width: 16rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .receipt-total-row {
      display: flex;
      justify-content: space-between;
    }
    
    .receipt-total-label {
      color: #6b7280;
    }
    
    .receipt-total-value {
      font-weight: 500;
    }
    
    .receipt-total-final {
      border-top: 2px solid #d1d5db;
      padding-top: 0.5rem;
      margin-top: 0;
      font-size: 1.125rem;
      font-weight: bold;
    }
    
    .receipt-payment-method {
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .receipt-transaction-id {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .receipt-thank-you {
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      white-space: pre-line;
      font-weight: 500;
    }
    
    ${
      isExport
        ? `
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        orphans: 3;
        widows: 3;
      }
      
      /* Receipt sections can break across pages */
      .section-receipt-header,
      .section-receipt-items,
      .section-receipt-footer {
        page-break-inside: auto;
        break-inside: auto;
        page-break-before: auto;
      }
      
      /* Prevent individual receipt item rows from breaking */
      .receipt-items-table tbody tr.receipt-item-row {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Keep receipt footer totals together if possible, but allow breaking if needed */
      .receipt-totals-wrapper {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    `
        : `
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
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

export function generateReceiptPreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
): string {
  return generateReceiptHTML(sections, globalStyles, false);
}

export function generateReceiptExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
): string {
  return generateReceiptHTML(sections, globalStyles, true);
}

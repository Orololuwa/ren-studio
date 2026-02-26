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

function renderPackingSlipSectionToHTML(
  section: TemplateSection,
  globalColorPalette: string[] = [],
): string {
  const sectionColorPalette = getSectionColorPalette(
    section.usingGlobalPalette,
    section.colorPalette,
    globalColorPalette,
  );
  const inlineStyles = objectToCSS(section.styles, sectionColorPalette);

  switch (section.type) {
    case "packing-slip-header": {
      const logoUrl = section.data.companyLogo as string | undefined;
      return `
        <section class="section-ps-header" style="${inlineStyles}">
          <div class="ps-header-content">
            <div class="ps-company-info">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Company Logo" class="ps-company-logo" loading="eager" />` : ""}
              <h1 class="ps-company-name">${escapeHtml(String(section.data.companyName || ""))}</h1>
              ${section.data.companyAddress ? `<div class="ps-company-address">${escapeHtml(String(section.data.companyAddress)).replace(/\n/g, "<br>")}</div>` : ""}
              ${section.data.companyEmail ? `<div class="ps-company-contact">${escapeHtml(String(section.data.companyEmail))}</div>` : ""}
              ${section.data.companyPhone ? `<div class="ps-company-contact">${escapeHtml(String(section.data.companyPhone))}</div>` : ""}
            </div>
            <div class="ps-meta">
              <h2 class="ps-title">PACKING SLIP</h2>
              <div class="ps-details">
                ${section.data.shipmentNumber ? `<div><span class="ps-label">Shipment #:</span> ${escapeHtml(String(section.data.shipmentNumber))}</div>` : ""}
                ${section.data.orderReference ? `<div><span class="ps-label">Order Ref:</span> ${escapeHtml(String(section.data.orderReference))}</div>` : ""}
                ${section.data.shipDate ? `<div><span class="ps-label">Ship Date:</span> ${escapeHtml(String(section.data.shipDate))}</div>` : ""}
              </div>
            </div>
          </div>
          <div class="ps-addresses">
            <div class="ps-ship-from">
              <h3>Ship From:</h3>
              ${section.data.shipFromName ? `<div class="ps-from-name">${escapeHtml(String(section.data.shipFromName))}</div>` : ""}
              ${section.data.shipFromAddress ? `<div class="ps-from-address">${escapeHtml(String(section.data.shipFromAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            <div class="ps-ship-to">
              <h3>Ship To:</h3>
              ${section.data.shipToName ? `<div class="ps-to-name">${escapeHtml(String(section.data.shipToName))}</div>` : ""}
              ${section.data.shipToAddress ? `<div class="ps-to-address">${escapeHtml(String(section.data.shipToAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
          </div>
        </section>
      `;
    }

    case "packing-slip-items": {
      const items = Array.isArray(section.data.items)
        ? (section.data.items as Array<{
            description: string;
            quantity: string;
          }>)
        : [];
      return `
        <section class="section-ps-items" style="${inlineStyles}">
          <table class="ps-items-table">
            <thead>
              <tr>
                <th class="ps-item-description">Description</th>
                <th class="ps-item-quantity">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length === 0
                  ? `<tr><td colspan="2" class="ps-empty">No items</td></tr>`
                  : items
                      .map(
                        (item) => `
                <tr class="ps-item-row">
                  <td>${escapeHtml(item.description || "")}</td>
                  <td class="ps-item-number">${escapeHtml(item.quantity || "0")}</td>
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

    case "packing-slip-footer": {
      return `
        <section class="section-ps-footer" style="${inlineStyles}">
          <div class="ps-footer-info">
            ${section.data.shippingMethod ? `<div><strong>Shipping Method:</strong> ${escapeHtml(String(section.data.shippingMethod))}</div>` : ""}
            ${section.data.trackingNumber ? `<div><strong>Tracking #:</strong> ${escapeHtml(String(section.data.trackingNumber))}</div>` : ""}
          </div>
          ${
            section.data.notes
              ? `<div class="ps-notes"><strong>Notes:</strong> <div class="rich-text-content">${sanitizeQuillHtml(String(section.data.notes))}</div></div>`
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

function generatePackingSlipHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  isExport: boolean,
  colorPalette: string[] = [],
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const globalCSS = objectToCSS(globalStyles as SectionStyles, colorPalette);
  const sectionsHTML = sortedSections
    .map((section) => renderPackingSlipSectionToHTML(section, colorPalette))
    .join("\n");

  const textColor = globalStyles.color || globalStyles.textColor || "#000000";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExport ? "Packing Slip Export" : "Packing Slip Preview"}</title>
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

    .section-ps-header { margin-bottom: 2rem; }
    .ps-header-content { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .ps-company-info { flex: 1; }
    .ps-company-logo { max-height: 60px; max-width: 200px; margin-bottom: 1rem; object-fit: contain; }
    .ps-company-name { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
    .ps-company-address, .ps-company-contact { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; white-space: pre-line; }
    .section-ps-header[style*="background"] .ps-company-address,
    .section-ps-header[style*="background"] .ps-company-contact,
    .section-ps-header[style*="background"] .ps-label,
    .section-ps-header[style*="background"] .ps-from-address,
    .section-ps-header[style*="background"] .ps-to-address { color: inherit; opacity: 0.9; }
    .ps-meta { text-align: right; }
    .ps-title { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
    .ps-details { font-size: 0.875rem; }
    .ps-details div { margin-bottom: 0.25rem; }
    .ps-label { color: #6b7280; }
    .ps-addresses { display: flex; justify-content: space-between; margin-top: 2rem; }
    .ps-ship-from, .ps-ship-to { flex: 1; }
    .ps-ship-from h3, .ps-ship-to h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .ps-from-name, .ps-to-name { font-weight: 500; margin-bottom: 0.25rem; }
    .ps-from-address, .ps-to-address { font-size: 0.875rem; color: #6b7280; white-space: pre-line; }
    .section-ps-header[style*="background"] h1, .section-ps-header[style*="background"] h2,
    .section-ps-header[style*="background"] h3, .section-ps-header[style*="background"] .ps-from-name,
    .section-ps-header[style*="background"] .ps-to-name { color: inherit; }
    .section-ps-items { margin: 2rem 0; }
    .ps-items-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .ps-items-table thead { background-color: #f3f4f6; }
    .ps-items-table th { padding: 0.75rem; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .ps-item-quantity { text-align: right; }
    .ps-items-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
    .ps-item-description { max-width: 70%; }
    .ps-item-number { text-align: right; }
    .ps-empty { text-align: center; color: #9ca3af; padding: 2rem; }
    .section-ps-footer { margin-top: 2rem; }
    .ps-footer-info { margin-bottom: 1rem; }
    .ps-footer-info div { margin-bottom: 0.5rem; }
    .ps-notes { font-size: 0.875rem; color: #4b5563; max-width: 100%; overflow-wrap: break-word; }
    .section-ps-items[style*="color"] .ps-items-table,
    .section-ps-items[style*="color"] .ps-items-table td,
    .section-ps-items[style*="color"] .ps-items-table th { color: inherit; }
    ${
      isExport
        ? `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; orphans: 3; widows: 3; }
      .section-ps-header, .section-ps-items, .section-ps-footer { page-break-inside: avoid; break-inside: avoid; }
      .ps-items-table tbody tr.ps-item-row { page-break-inside: avoid; break-inside: avoid; }
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

export function generatePackingSlipPreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generatePackingSlipHTML(sections, globalStyles, false, colorPalette);
}

export function generatePackingSlipExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generatePackingSlipHTML(sections, globalStyles, true, colorPalette);
}

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

function renderDeliveryNoteSectionToHTML(
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
    case "delivery-note-header": {
      const logoUrl = section.data.companyLogo as string | undefined;
      return `
        <section class="section-dn-header" style="${inlineStyles}">
          <div class="dn-header-content">
            <div class="dn-company-info">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Company Logo" class="dn-company-logo" loading="eager" />` : ""}
              <h1 class="dn-company-name">${escapeHtml(String(section.data.companyName || ""))}</h1>
              ${section.data.companyAddress ? `<div class="dn-company-address">${escapeHtml(String(section.data.companyAddress)).replace(/\n/g, "<br>")}</div>` : ""}
              ${section.data.companyEmail ? `<div class="dn-company-contact">${escapeHtml(String(section.data.companyEmail))}</div>` : ""}
              ${section.data.companyPhone ? `<div class="dn-company-contact">${escapeHtml(String(section.data.companyPhone))}</div>` : ""}
            </div>
            <div class="dn-meta">
              <h2 class="dn-title">DELIVERY NOTE</h2>
              <div class="dn-details">
                ${section.data.deliveryNoteNumber ? `<div><span class="dn-label">Delivery #:</span> ${escapeHtml(String(section.data.deliveryNoteNumber))}</div>` : ""}
                ${section.data.orderReference ? `<div><span class="dn-label">Order Ref:</span> ${escapeHtml(String(section.data.orderReference))}</div>` : ""}
                ${section.data.deliveryDate ? `<div><span class="dn-label">Delivery Date:</span> ${escapeHtml(String(section.data.deliveryDate))}</div>` : ""}
              </div>
            </div>
          </div>
          <div class="dn-addresses">
            <div class="dn-delivered-by">
              <h3>Delivered By:</h3>
              ${section.data.deliveredByName ? `<div class="dn-by-name">${escapeHtml(String(section.data.deliveredByName))}</div>` : ""}
              ${section.data.deliveredByCompany ? `<div class="dn-by-company">${escapeHtml(String(section.data.deliveredByCompany))}</div>` : ""}
            </div>
            <div class="dn-delivered-to">
              <h3>Delivered To:</h3>
              ${section.data.deliveredToName ? `<div class="dn-to-name">${escapeHtml(String(section.data.deliveredToName))}</div>` : ""}
              ${section.data.deliveredToAddress ? `<div class="dn-to-address">${escapeHtml(String(section.data.deliveredToAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
          </div>
        </section>
      `;
    }

    case "delivery-note-items": {
      const items = Array.isArray(section.data.items)
        ? (section.data.items as Array<{
            description: string;
            quantity: string;
          }>)
        : [];
      return `
        <section class="section-dn-items" style="${inlineStyles}">
          <table class="dn-items-table">
            <thead>
              <tr>
                <th class="dn-item-description">Description</th>
                <th class="dn-item-quantity">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length === 0
                  ? `<tr><td colspan="2" class="dn-empty">No items</td></tr>`
                  : items
                      .map(
                        (item) => `
                <tr class="dn-item-row">
                  <td>${escapeHtml(item.description || "")}</td>
                  <td class="dn-item-number">${escapeHtml(item.quantity || "0")}</td>
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

    case "delivery-note-footer": {
      return `
        <section class="section-dn-footer" style="${inlineStyles}">
          <div class="dn-footer-acknowledgment">
            ${section.data.receivedByName ? `<div><strong>Received By:</strong> ${escapeHtml(String(section.data.receivedByName))}</div>` : ""}
            ${section.data.receivedByTitle ? `<div><strong>Title:</strong> ${escapeHtml(String(section.data.receivedByTitle))}</div>` : ""}
            ${section.data.receivedDate ? `<div><strong>Date:</strong> ${escapeHtml(String(section.data.receivedDate))}</div>` : ""}
            ${section.data.conditionReceived ? `<div><strong>Condition Received:</strong> ${escapeHtml(String(section.data.conditionReceived))}</div>` : ""}
          </div>
          ${
            section.data.notes
              ? `<div class="dn-notes"><strong>Notes:</strong> <div class="rich-text-content">${sanitizeQuillHtml(String(section.data.notes))}</div></div>`
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

function generateDeliveryNoteHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  isExport: boolean,
  colorPalette: string[] = [],
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const globalCSS = objectToCSS(globalStyles as SectionStyles, colorPalette);
  const sectionsHTML = sortedSections
    .map((section) => renderDeliveryNoteSectionToHTML(section, colorPalette))
    .join("\n");

  const textColor = globalStyles.color || globalStyles.textColor || "#000000";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExport ? "Delivery Note Export" : "Delivery Note Preview"}</title>
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

    .section-dn-header { margin-bottom: 2rem; }
    .dn-header-content { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .dn-company-info { flex: 1; }
    .dn-company-logo { max-height: 60px; max-width: 200px; margin-bottom: 1rem; object-fit: contain; }
    .dn-company-name { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
    .dn-company-address, .dn-company-contact { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; white-space: pre-line; }
    .section-dn-header[style*="background"] .dn-company-address,
    .section-dn-header[style*="background"] .dn-company-contact,
    .section-dn-header[style*="background"] .dn-label,
    .section-dn-header[style*="background"] .dn-by-company,
    .section-dn-header[style*="background"] .dn-to-address { color: inherit; opacity: 0.9; }
    .dn-meta { text-align: right; }
    .dn-title { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
    .dn-details { font-size: 0.875rem; }
    .dn-details div { margin-bottom: 0.25rem; }
    .dn-label { color: #6b7280; }
    .dn-addresses { display: flex; justify-content: space-between; margin-top: 2rem; }
    .dn-delivered-by, .dn-delivered-to { flex: 1; }
    .dn-delivered-by h3, .dn-delivered-to h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .dn-by-name, .dn-to-name { font-weight: 500; margin-bottom: 0.25rem; }
    .dn-by-company, .dn-to-address { font-size: 0.875rem; color: #6b7280; white-space: pre-line; }
    .section-dn-header[style*="background"] h1, .section-dn-header[style*="background"] h2,
    .section-dn-header[style*="background"] h3, .section-dn-header[style*="background"] .dn-by-name,
    .section-dn-header[style*="background"] .dn-to-name { color: inherit; }
    .section-dn-items { margin: 2rem 0; }
    .dn-items-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .dn-items-table thead { background-color: #f3f4f6; }
    .dn-items-table th { padding: 0.75rem; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    .dn-item-quantity { text-align: right; }
    .dn-items-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
    .dn-item-description { max-width: 70%; }
    .dn-item-number { text-align: right; }
    .dn-empty { text-align: center; color: #9ca3af; padding: 2rem; }
    .section-dn-footer { margin-top: 2rem; }
    .dn-footer-acknowledgment { margin-bottom: 1rem; }
    .dn-footer-acknowledgment div { margin-bottom: 0.5rem; }
    .dn-notes { font-size: 0.875rem; color: #4b5563; max-width: 100%; overflow-wrap: break-word; }
    .section-dn-items[style*="color"] .dn-items-table,
    .section-dn-items[style*="color"] .dn-items-table td,
    .section-dn-items[style*="color"] .dn-items-table th { color: inherit; }
    ${
      isExport
        ? `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; orphans: 3; widows: 3; }
      .section-dn-header, .section-dn-items, .section-dn-footer { page-break-inside: avoid; break-inside: avoid; }
      .dn-items-table tbody tr.dn-item-row { page-break-inside: avoid; break-inside: avoid; }
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

export function generateDeliveryNotePreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateDeliveryNoteHTML(sections, globalStyles, false, colorPalette);
}

export function generateDeliveryNoteExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateDeliveryNoteHTML(sections, globalStyles, true, colorPalette);
}

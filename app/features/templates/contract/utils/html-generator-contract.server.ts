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

function renderContractSectionToHTML(
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
    case "contract-header": {
      return `
        <section class="section-contract-header" style="${inlineStyles}">
          <h1 class="contract-title">${escapeHtml(String(section.data.contractTitle || ""))}</h1>
          <div class="contract-meta">
            ${section.data.contractRef ? `<div class="contract-ref"><span class="contract-label">Contract Ref:</span> ${escapeHtml(String(section.data.contractRef))}</div>` : ""}
            ${section.data.effectiveDate ? `<div class="contract-date"><span class="contract-label">Effective Date:</span> ${escapeHtml(String(section.data.effectiveDate))}</div>` : ""}
          </div>
          <div class="contract-parties">
            <div class="contract-party">
              <h3>Party A</h3>
              ${section.data.partyAName ? `<div class="contract-party-name">${escapeHtml(String(section.data.partyAName))}</div>` : ""}
              ${section.data.partyAAddress ? `<div class="contract-party-address">${escapeHtml(String(section.data.partyAAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            <div class="contract-party">
              <h3>Party B</h3>
              ${section.data.partyBName ? `<div class="contract-party-name">${escapeHtml(String(section.data.partyBName))}</div>` : ""}
              ${section.data.partyBAddress ? `<div class="contract-party-address">${escapeHtml(String(section.data.partyBAddress)).replace(/\n/g, "<br>")}</div>` : ""}
            </div>
          </div>
        </section>
      `;
    }

    case "contract-body": {
      return `
        <section class="section-contract-body" style="${inlineStyles}">
          <div class="contract-content rich-text-content">${sanitizeQuillHtml(String(section.data.content || ""))}</div>
        </section>
      `;
    }

    case "contract-signature": {
      return `
        <section class="section-contract-signature" style="${inlineStyles}">
          <div class="contract-signatures">
            <div class="contract-signature-block">
              <div class="contract-signature-name">${escapeHtml(String(section.data.partyASignatureName || ""))}</div>
              ${section.data.partyASignatureTitle ? `<div class="contract-signature-title">${escapeHtml(String(section.data.partyASignatureTitle))}</div>` : ""}
              ${section.data.partyADate ? `<div class="contract-signature-date">${escapeHtml(String(section.data.partyADate))}</div>` : ""}
            </div>
            <div class="contract-signature-block">
              <div class="contract-signature-name">${escapeHtml(String(section.data.partyBSignatureName || ""))}</div>
              ${section.data.partyBSignatureTitle ? `<div class="contract-signature-title">${escapeHtml(String(section.data.partyBSignatureTitle))}</div>` : ""}
              ${section.data.partyBDate ? `<div class="contract-signature-date">${escapeHtml(String(section.data.partyBDate))}</div>` : ""}
            </div>
          </div>
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

function generateContractHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  isExport: boolean,
  colorPalette: string[] = [],
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const globalCSS = objectToCSS(globalStyles as SectionStyles, colorPalette);
  const sectionsHTML = sortedSections
    .map((section) => renderContractSectionToHTML(section, colorPalette))
    .join("\n");

  const textColor = globalStyles.color || globalStyles.textColor || "#000000";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExport ? "Contract Export" : "Contract Preview"}</title>
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

    .section-contract-header { margin-bottom: 2rem; }
    .contract-title { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
    .contract-meta { font-size: 0.875rem; color: #6b7280; margin-bottom: 1.5rem; }
    .contract-meta div { margin-bottom: 0.25rem; }
    .contract-label { font-weight: 500; }
    .contract-parties { display: flex; justify-content: space-between; gap: 2rem; margin-top: 1.5rem; }
    .contract-party { flex: 1; }
    .contract-party h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .contract-party-name { font-weight: 500; margin-bottom: 0.25rem; }
    .contract-party-address { font-size: 0.875rem; color: #6b7280; white-space: pre-line; }
    .section-contract-header[style*="background"] .contract-party-address,
    .section-contract-header[style*="background"] .contract-meta { color: inherit; opacity: 0.9; }
    .section-contract-body { margin: 2rem 0; }
    .contract-content { max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
    .contract-content p { margin-bottom: 1rem; }
    .contract-content p:last-child { margin-bottom: 0; }
    .contract-content strong { font-weight: 600; }
    .section-contract-signature { margin-top: 3rem; }
    .contract-signatures { display: flex; justify-content: space-between; gap: 3rem; }
    .contract-signature-block { flex: 1; }
    .contract-signature-name { font-weight: 600; margin-bottom: 0.25rem; border-bottom: 1px solid #000; min-height: 1.5em; }
    .contract-signature-title { font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem; }
    .contract-signature-date { font-size: 0.875rem; margin-top: 0.25rem; }
    .section-contract-signature[style*="color"] .contract-signature-title { color: inherit; opacity: 0.9; }
    ${
      isExport
        ? `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; orphans: 3; widows: 3; }
      .section-contract-header, .section-contract-body, .section-contract-signature { page-break-inside: avoid; break-inside: avoid; }
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

export function generateContractPreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateContractHTML(sections, globalStyles, false, colorPalette);
}

export function generateContractExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateContractHTML(sections, globalStyles, true, colorPalette);
}

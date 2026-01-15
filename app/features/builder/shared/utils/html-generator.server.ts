import {
  generateInvoiceExportHTML,
  generateInvoicePreviewHTML,
} from "../../invoice/utils/html-generator-invoice.server";
import {
  generateReceiptExportHTML,
  generateReceiptPreviewHTML,
} from "../../receipt/utils/html-generator-receipt.server";
import {
  generateResumeExportHTML,
  generateResumePreviewHTML,
} from "../../resume/utils/html-generator-resume.server";
import type { TemplateSection, TemplateType } from "../types";

/**
 * Routes to the appropriate HTML generator based on template type
 */
export function generatePreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  templateType: TemplateType,
  colorPalette: string[] = [],
): string {
  switch (templateType) {
    case "resume":
      return generateResumePreviewHTML(sections, globalStyles, colorPalette);
    case "invoice":
      return generateInvoicePreviewHTML(sections, globalStyles, colorPalette);
    case "receipt":
      return generateReceiptPreviewHTML(sections, globalStyles, colorPalette);
    default:
      // Fallback for unsupported types - return basic HTML
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template Preview</title>
</head>
<body>
  <div class="template-container">
    <p>Template type "${templateType}" is not yet supported.</p>
  </div>
</body>
</html>
      `.trim();
  }
}

/**
 * Routes to the appropriate HTML generator for export based on template type
 */
export function generateExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  templateType: TemplateType,
  colorPalette: string[] = [],
): string {
  switch (templateType) {
    case "resume":
      return generateResumeExportHTML(sections, globalStyles, colorPalette);
    case "invoice":
      return generateInvoiceExportHTML(sections, globalStyles, colorPalette);
    case "receipt":
      return generateReceiptExportHTML(sections, globalStyles, colorPalette);
    default:
      // Fallback for unsupported types - return basic HTML
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template Export</title>
</head>
<body>
  <div class="template-container">
    <p>Template type "${templateType}" is not yet supported.</p>
  </div>
</body>
</html>
      `.trim();
  }
}

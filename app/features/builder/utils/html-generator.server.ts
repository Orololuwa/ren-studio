import type { TemplateSection, TemplateType } from "../types";
import {
  generateInvoiceExportHTML,
  generateInvoicePreviewHTML,
} from "./html-generator-invoice.server";
import {
  generateResumeExportHTML,
  generateResumePreviewHTML,
} from "./html-generator-resume.server";

/**
 * Routes to the appropriate HTML generator based on template type
 */
export function generatePreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  templateType: TemplateType,
): string {
  switch (templateType) {
    case "resume":
      return generateResumePreviewHTML(sections, globalStyles);
    case "invoice":
      return generateInvoicePreviewHTML(sections, globalStyles);
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
): string {
  switch (templateType) {
    case "resume":
      return generateResumeExportHTML(sections, globalStyles);
    case "invoice":
      return generateInvoiceExportHTML(sections, globalStyles);
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

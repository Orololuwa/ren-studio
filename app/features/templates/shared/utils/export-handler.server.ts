import type { Template } from "../types";
import { generateExportHTML } from "./html-generator.server";
import { mergeDataIntoTemplate } from "./merge-template-data.server";
import { generatePDF } from "./pdf-generator.server";

export type ExportResponseFormat = "json" | "pdf";

export interface ExportHandlerOptions {
  template: Template;
  sections?: Record<string, Record<string, unknown>>;
  format?: ExportResponseFormat;
}

export interface ExportHandlerResult {
  response: Response;
}

/**
 * Handles an export request for a template.
 * Generates PDF from the template and optional data overrides.
 * @param options - The export handler options
 * @returns A Response object with PDF or JSON based on format
 */
export async function handleExportRequest(
  options: ExportHandlerOptions,
): Promise<ExportHandlerResult> {
  const { template, sections = {}, format = "pdf" } = options;

  try {
    // Merge provided data into template sections
    const mergedSections = mergeDataIntoTemplate(template, sections);

    // Generate HTML using template config and merged sections
    const html = generateExportHTML(
      mergedSections,
      template.globalStyles,
      template.type,
      template.colorPalette,
    );

    // Generate PDF
    const pdfBuffer = await generatePDF(html);

    if (format === "json") {
      // Convert PDF buffer to base64 for JSON response
      const pdfBase64 = pdfBuffer.toString("base64");

      return {
        response: Response.json(
          {
            success: true,
            data: {
              pdf: pdfBase64,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      };
    }

    // Default: return PDF directly
    const filename = template.name ? `${template.name}.pdf` : "template.pdf";

    return {
      response: new Response(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": "application/pdf",
        },
      }),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      response: Response.json(
        {
          success: false,
          error: {
            code: "export_generation_failed",
            message: `Failed to generate export: ${errorMessage}`,
          },
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    };
  }
}

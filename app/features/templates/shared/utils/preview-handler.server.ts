import type { Template } from "../types";
import { generatePreviewHTML } from "./html-generator.server";
import { mergeDataIntoTemplate } from "./merge-template-data.server";

export type PreviewResponseFormat = "json" | "html";

export interface PreviewHandlerOptions {
  template: Template;
  sections?: Record<string, Record<string, unknown>>;
  format?: PreviewResponseFormat;
}

export interface PreviewHandlerResult {
  response: Response;
}

/**
 * Handles a preview request for a template.
 * Generates HTML from the template and optional data overrides.
 * @param options - The preview handler options
 * @returns A Response object with HTML or JSON based on format
 */
export async function handlePreviewRequest(
  options: PreviewHandlerOptions,
): Promise<PreviewHandlerResult> {
  const { template, sections = {}, format = "html" } = options;

  try {
    // Merge provided data into template sections
    const mergedSections = mergeDataIntoTemplate(template, sections);

    // Generate HTML using template config and merged sections
    const html = generatePreviewHTML(
      mergedSections,
      template.globalStyles,
      template.type,
      template.colorPalette,
    );

    if (format === "json") {
      return {
        response: Response.json(
          {
            success: true,
            data: {
              html,
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

    // Default: return HTML directly
    return {
      response: new Response(html, {
        headers: {
          "Content-Type": "text/html",
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
            code: "preview_generation_failed",
            message: `Failed to generate preview: ${errorMessage}`,
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

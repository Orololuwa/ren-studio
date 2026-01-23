import { z } from "zod";

import type { Route } from "./+types/preview";
import { retrieveTemplateFromDatabaseById } from "~/features/builder/shared/builder-model.server";
import { getTemplateById } from "~/features/builder/shared/templates";
import type { PreviewResponseFormat } from "~/features/builder/shared/utils/preview-handler.server";
import { handlePreviewRequest } from "~/features/builder/shared/utils/preview-handler.server";
import { authenticateApiKey } from "~/features/organizations/settings/api-keys/api-key-auth.server";
import { validateJson } from "~/utils/validate-json.server";

const previewSchema = z.object({
  sections: z
    .record(z.string(), z.record(z.string(), z.unknown()))
    .optional()
    .default({}),
});

/**
 * Determines the response format from the request.
 * Supports Accept header or ?format=json query parameter.
 */
function getResponseFormat(request: Request): PreviewResponseFormat {
  const url = new URL(request.url);
  const formatParam = url.searchParams.get("format");

  if (formatParam === "json") {
    return "json";
  }

  const acceptHeader = request.headers.get("Accept");
  if (acceptHeader?.includes("application/json")) {
    return "json";
  }

  // Default to HTML
  return "html";
}

export async function loader() {
  return Response.json(
    {
      success: false,
      error: {
        code: "method_not_allowed",
        message: "Method not allowed. Use POST to generate a preview.",
      },
    },
    { status: 405 },
  );
}

export async function action({ request, params }: Route.ActionArgs) {
  try {
    // Authenticate API key and get organization
    const { organization, headers } = await authenticateApiKey(request);

    const typedParams = params as {
      templateId: string;
    };

    // Validate request body
    const result = await validateJson(request, previewSchema);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: {
            code: "invalid_request",
            message: "Invalid request body",
            details: result.response,
          },
        },
        { status: 400, headers: Object.fromEntries(headers) },
      );
    }

    const { data: body } = result;

    // Load template from database or predefined templates
    let template = await retrieveTemplateFromDatabaseById({
      organizationId: organization.id,
      templateId: typedParams.templateId,
    });

    // Fallback to predefined templates if not found in database
    if (!template) {
      template = getTemplateById(typedParams.templateId) || null;
    }

    if (!template) {
      return Response.json(
        {
          success: false,
          error: {
            code: "template_not_found",
            message: `Template with ID ${typedParams.templateId} not found`,
          },
        },
        { status: 404, headers: Object.fromEntries(headers) },
      );
    }

    // Determine response format
    const format = getResponseFormat(request);

    // Handle preview request
    const { response } = await handlePreviewRequest({
      template,
      sections: body.sections,
      format,
    });

    // Merge headers
    const mergedHeaders = new Headers(response.headers);
    Object.entries(Object.fromEntries(headers)).forEach(([key, value]) => {
      mergedHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers: mergedHeaders,
    });
  } catch (error) {
    // If error is already a Response (from authenticateApiKey), re-throw it
    if (error instanceof Response) {
      return error;
    }

    // Otherwise, return a generic error
    console.error("Error in preview API:", error);
    return Response.json(
      {
        success: false,
        error: {
          code: "internal_server_error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      },
      { status: 500 },
    );
  }
}

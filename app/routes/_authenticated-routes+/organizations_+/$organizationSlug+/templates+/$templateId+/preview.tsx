import { z } from "zod";

import type { Route } from "./+types/preview";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getTemplateById } from "~/features/templates/shared/templates";
import { retrieveTemplateFromDatabaseById } from "~/features/templates/shared/templates-model.server";
import { generatePreviewHTML } from "~/features/templates/shared/utils/html-generator.server";
import { mergeDataIntoTemplate } from "~/features/templates/shared/utils/merge-template-data.server";
import { validateJson } from "~/utils/validate-json.server";

const previewSchema = z.object({
  sections: z
    .record(z.string(), z.record(z.string(), z.unknown()))
    .optional()
    .default({}),
});

export async function action({ request, context, params }: Route.ActionArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);
  const typedParams = params as {
    organizationSlug: string;
    templateId: string;
  };

  const result = await validateJson(request, previewSchema);

  if (!result.success) {
    return result.response;
  }

  const { data: body } = result;

  try {
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
          error: "Template not found",
          message: `Template with ID ${typedParams.templateId} not found`,
        },
        { headers: Object.fromEntries(headers), status: 404 },
      );
    }

    // Merge provided data into template sections
    const mergedSections = mergeDataIntoTemplate(template, body.sections || {});

    // Generate HTML using template config and merged sections
    const html = generatePreviewHTML(
      mergedSections,
      template.globalStyles,
      template.type,
      template.colorPalette,
    );

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        ...Object.fromEntries(headers),
      },
    });
  } catch (error) {
    console.error("Error generating preview HTML:", error);
    return Response.json(
      {
        error: "Failed to generate preview",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { headers: Object.fromEntries(headers), status: 500 },
    );
  }
}

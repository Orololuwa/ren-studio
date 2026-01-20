import { z } from "zod";

import type { Route } from "./+types/export";
import { retrieveTemplateFromDatabaseById } from "~/features/builder/shared/builder-model.server";
import { getTemplateById } from "~/features/builder/shared/templates";
import { generateExportHTML } from "~/features/builder/shared/utils/html-generator.server";
import { mergeDataIntoTemplate } from "~/features/builder/shared/utils/merge-template-data.server";
import { generatePDF } from "~/features/builder/shared/utils/pdf-generator.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { validateJson } from "~/utils/validate-json.server";

const exportSchema = z.object({
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

  const result = await validateJson(request, exportSchema);

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

    // Generate PDF using template config and merged sections
    const html = generateExportHTML(
      mergedSections,
      template.globalStyles,
      template.type,
      template.colorPalette,
    );

    const pdfBuffer = await generatePDF(html);

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Disposition": `attachment; filename="${template.name || "template"}.pdf"`,
        "Content-Type": "application/pdf",
        ...Object.fromEntries(headers),
      },
    });
  } catch (error) {
    console.error("Error generating export PDF:", error);
    return Response.json(
      {
        error: "Failed to generate PDF",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { headers: Object.fromEntries(headers), status: 500 },
    );
  }
}

import { z } from "zod";

import type { Route } from "./+types/export";
import type { TemplateSection } from "~/features/builder/shared/types";
import { generateExportHTML } from "~/features/builder/shared/utils/html-generator.server";
import { generatePDF } from "~/features/builder/shared/utils/pdf-generator.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const exportSchema = z.object({
  colorPalette: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((val) => {
      if (!val) return [];
      if (typeof val === "string") {
        return JSON.parse(val) as string[];
      }
      return val;
    }),
  globalStyles: z
    .union([z.record(z.string(), z.string()), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        return JSON.parse(val) as Record<string, string>;
      }
      return val;
    }),
  name: z.string(),
  sections: z.union([z.array(z.any()), z.string()]).transform((val) => {
    if (typeof val === "string") {
      return JSON.parse(val) as unknown[];
    }
    return val;
  }),
  type: z.enum([
    "resume",
    "invoice",
    "certificate",
    "report-cards",
    "quote",
    "proposal",
    "contract",
    "purchase-order",
    "receipt",
    "estimate",
    "statement",
    "letter",
    "form",
    "label",
  ]),
});

export async function action({ request, context }: Route.ActionArgs) {
  const { headers } = context.get(organizationMembershipContext);

  const result = await validateFormData(request, exportSchema);

  if (!result.success) {
    return result.response;
  }

  const { data: body } = result;

  try {
    const html = generateExportHTML(
      body.sections as TemplateSection[],
      body.globalStyles,
      body.type,
      body.colorPalette || [],
    );

    const pdfBuffer = await generatePDF(html);

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Disposition": `attachment; filename="${body.name || "template"}.pdf"`,
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

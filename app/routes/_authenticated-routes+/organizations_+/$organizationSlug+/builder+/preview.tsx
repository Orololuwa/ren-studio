import { z } from "zod";

import type { Route } from "./+types/preview";
import type { TemplateSection } from "~/features/builder/shared/types";
import { generatePreviewHTML } from "~/features/builder/shared/utils/html-generator.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const previewSchema = z.object({
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
  colorPalette: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (typeof val === "string") {
        return JSON.parse(val) as string[];
      }
      return val;
    }),
});

export async function action({ request, context }: Route.ActionArgs) {
  const { headers } = context.get(organizationMembershipContext);

  const result = await validateFormData(request, previewSchema);

  if (!result.success) {
    return result.response;
  }

  const { data: body } = result;

  try {
    const html = generatePreviewHTML(
      body.sections as TemplateSection[],
      body.globalStyles,
      body.type,
      body.colorPalette,
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

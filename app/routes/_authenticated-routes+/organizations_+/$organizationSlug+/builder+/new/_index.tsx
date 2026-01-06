import { redirect } from "react-router";

import type { Route } from "./+types/_index";

export async function loader({ params }: Route.LoaderArgs) {
  // Phase 4: Database doesn't exist yet
  // This functionality will be implemented in Phase 8 after database schema is created
  // For now, redirect back to builder page
  const organizationSlug = (params as { organizationSlug?: string })
    .organizationSlug;
  if (!organizationSlug) {
    throw new Error("organizationSlug is required");
  }
  return redirect(`/organizations/${organizationSlug}/builder`);

  // Phase 8 implementation will replace the above:
  // const { organization } = context.get(organizationMembershipContext);
  // const newTemplate = createEmptyTemplate("resume", organization.id, "Untitled Template");
  // const savedTemplate = await db.template.create({ data: { ... } });
  // return redirect(`/organizations/${params.organizationSlug}/builder/${savedTemplate.id}`);
}

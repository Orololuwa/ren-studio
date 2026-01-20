import { data } from "react-router";

import { createOrRegenerateApiKey } from "./api-key-model.server";
import type { OrganizationMembershipRole } from "~/generated/client";

/**
 * Action handler for regenerating an organization's API key.
 * Validates that the user is an owner or admin before allowing the operation.
 */
export async function regenerateApiKeyAction({
  organizationId,
  userId,
  role,
}: {
  organizationId: string;
  userId: string;
  role: OrganizationMembershipRole;
}) {
  // Only owners and admins can regenerate API keys
  if (role !== "owner" && role !== "admin") {
    return data(
      {
        error: "Unauthorized",
        message: "Only owners and admins can regenerate API keys",
      },
      { status: 403 },
    );
  }

  try {
    const newApiKey = await createOrRegenerateApiKey(organizationId, userId);

    return data({
      success: true,
      apiKey: newApiKey,
    });
  } catch (error) {
    console.error("Error regenerating API key:", error);
    return data(
      {
        error: "Failed to regenerate API key",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

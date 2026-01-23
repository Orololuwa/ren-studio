import { verifyApiKey } from "./api-key-utils.server";
import { retrieveOrganizationFromDatabaseById } from "~/features/organizations/organizations-model.server";
import type { Organization } from "~/generated/client";
import { prisma } from "~/utils/database.server";

/**
 * Extracts the API key from the Authorization header.
 * Supports both "Bearer sk_live_..." and "sk_live_..." formats.
 * @param request - The incoming request
 * @returns The API key string or null if not found
 */
function extractApiKeyFromHeader(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer sk_live_..." and "sk_live_..." formats
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // If it starts with the API key prefix, assume it's the key itself
  if (authHeader.startsWith("sk_live_")) {
    return authHeader.trim();
  }

  return null;
}

/**
 * Authenticates an API key from the request and returns the associated organization.
 * @param request - The incoming request
 * @returns Object containing the organization and headers, or throws a Response with 401 status
 * @throws {Response} 401 Unauthorized if API key is missing or invalid
 */
export async function authenticateApiKey(
  request: Request,
): Promise<{ organization: Organization; headers: Headers }> {
  const apiKey = extractApiKeyFromHeader(request);

  if (!apiKey) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "missing_api_key",
          message:
            "API key is required. Provide it in the Authorization header as 'Bearer sk_live_...' or 'sk_live_...'",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Find the API key record by checking all organizations
  // Since organizationId is unique, we can find it by decrypting and comparing
  const allApiKeys = await prisma.organizationApiKey.findMany({
    select: {
      organizationId: true,
      encryptedKey: true,
    },
  });

  let matchingOrganizationId: string | null = null;

  for (const apiKeyRecord of allApiKeys) {
    try {
      if (verifyApiKey(apiKey, apiKeyRecord.encryptedKey)) {
        matchingOrganizationId = apiKeyRecord.organizationId;
        break;
      }
    } catch {
      // Verification failed, try next key
    }
  }

  if (!matchingOrganizationId) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "invalid_api_key",
          message: "Invalid API key",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Get the organization
  const organization = await retrieveOrganizationFromDatabaseById(
    matchingOrganizationId,
  );

  if (!organization) {
    throw new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "organization_not_found",
          message: "Organization associated with API key not found",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  return { organization, headers };
}

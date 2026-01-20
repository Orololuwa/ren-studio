import {
  decryptApiKey,
  encryptApiKey,
  generateApiKey,
  getApiKeyPrefix,
} from "./api-key-utils.server";
import { prisma } from "~/utils/database.server";

/**
 * Gets the API key record for an organization.
 * Returns only the prefix, never the encrypted key.
 */
export async function getOrganizationApiKey(organizationId: string) {
  const apiKey = await prisma.organizationApiKey.findUnique({
    where: { organizationId },
    select: {
      id: true,
      keyPrefix: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return apiKey;
}

/**
 * Gets and decrypts the full API key for an organization.
 * Only use this when the user needs to view/copy the key.
 * @param organizationId - The organization ID
 * @returns The plain API key, or null if not found
 */
export async function getDecryptedApiKey(
  organizationId: string,
): Promise<string | null> {
  const apiKey = await prisma.organizationApiKey.findUnique({
    where: { organizationId },
    select: {
      encryptedKey: true,
    },
  });

  if (!apiKey) {
    return null;
  }

  try {
    return decryptApiKey(apiKey.encryptedKey);
  } catch (error) {
    console.error("Error decrypting API key:", error);
    return null;
  }
}

/**
 * Creates or regenerates an API key for an organization.
 * If a key already exists, it will be replaced.
 * @param organizationId - The organization ID
 * @param createdById - The user ID who is creating/regenerating the key
 * @returns The plain API key (can be retrieved later via getDecryptedApiKey)
 */
export async function createOrRegenerateApiKey(
  organizationId: string,
  createdById: string,
): Promise<string> {
  // Generate new API key
  const plainKey = generateApiKey();
  const encryptedKey = encryptApiKey(plainKey);
  const keyPrefix = getApiKeyPrefix(plainKey);

  // Upsert: create if doesn't exist, update if it does
  await prisma.organizationApiKey.upsert({
    where: { organizationId },
    create: {
      organizationId,
      encryptedKey,
      keyPrefix,
      createdById,
    },
    update: {
      encryptedKey,
      keyPrefix,
      createdById,
      updatedAt: new Date(),
    },
  });

  // Return the plain key
  return plainKey;
}

/**
 * Deletes an API key for an organization.
 * @param organizationId - The organization ID
 */
export async function deleteApiKey(organizationId: string): Promise<void> {
  await prisma.organizationApiKey.delete({
    where: { organizationId },
  });
}

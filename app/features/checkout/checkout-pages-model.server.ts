import type { Prisma } from "~/generated/client";
import { prisma } from "~/utils/database.server";

export type CreateCheckoutPageInput = Prisma.CheckoutPageUncheckedCreateInput;

export async function retrieveCheckoutPagesFromDatabaseByOrganizationId({
  organizationId,
}: {
  organizationId: string;
}) {
  return await prisma.checkoutPage.findMany({
    orderBy: { createdAt: "desc" },
    where: { organizationId },
  });
}

/**
 * Returns how many checkout pages belong to an organization (for pagination).
 *
 * @param organizationId - Organization to count within.
 * @returns Total checkout page row count.
 */
export async function countCheckoutPagesInDatabaseByOrganizationId({
  organizationId,
}: {
  organizationId: string;
}) {
  return await prisma.checkoutPage.count({
    where: { organizationId },
  });
}

/**
 * Retrieves one page of checkout pages for an organization, newest first.
 *
 * @param organizationId - Organization to scope rows.
 * @param skip - Rows to skip (e.g. `(page - 1) * pageSize`).
 * @param take - Max rows to return (page size).
 * @returns Checkout pages for that slice.
 */
export async function retrieveCheckoutPagesPageFromDatabaseByOrganizationId({
  organizationId,
  skip,
  take,
}: {
  organizationId: string;
  skip: number;
  take: number;
}) {
  return await prisma.checkoutPage.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take,
    where: { organizationId },
  });
}

export async function retrieveCheckoutPageFromDatabaseById({
  checkoutPageId,
  organizationId,
}: {
  checkoutPageId: string;
  organizationId: string;
}) {
  return await prisma.checkoutPage.findFirst({
    where: { id: checkoutPageId, organizationId },
  });
}

export async function retrieveCheckoutPageFromDatabaseBySlug({
  slug,
}: {
  slug: string;
}) {
  return await prisma.checkoutPage.findUnique({ where: { slug } });
}

/** Lightweight existence check for slug availability (minimal DB payload). */
export async function isCheckoutSlugTakenInDatabase({
  slug,
}: {
  slug: string;
}): Promise<boolean> {
  const row = await prisma.checkoutPage.findUnique({
    where: { slug },
    select: { id: true },
  });
  return row !== null;
}

export async function createCheckoutPageToDatabase(
  input: CreateCheckoutPageInput,
) {
  return await prisma.checkoutPage.create({ data: input });
}

export async function updateCheckoutPageInDatabase({
  checkoutPageId,
  organizationId,
  data,
}: {
  checkoutPageId: string;
  organizationId: string;
  data: Prisma.CheckoutPageUpdateInput;
}) {
  const existing = await prisma.checkoutPage.findFirst({
    where: { id: checkoutPageId, organizationId },
    select: { id: true },
  });
  if (!existing) return null;
  return await prisma.checkoutPage.update({
    where: { id: checkoutPageId },
    data,
  });
}

export async function deleteCheckoutPageFromDatabase({
  checkoutPageId,
  organizationId,
}: {
  checkoutPageId: string;
  organizationId: string;
}) {
  const existing = await prisma.checkoutPage.findFirst({
    where: { id: checkoutPageId, organizationId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.checkoutPage.delete({ where: { id: checkoutPageId } });
  return true;
}

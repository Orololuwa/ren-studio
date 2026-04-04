import { prisma } from "~/utils/database.server";

/**
 * One-time public checkout links stop accepting new payments after a successful charge.
 * Idempotent: safe to call multiple times (e.g. webhook + return URL handler).
 */
export async function deactivateCheckoutPageAfterSuccessfulPaymentInDatabase({
  checkoutPageId,
}: {
  checkoutPageId: string;
}): Promise<void> {
  await prisma.checkoutPage.update({
    data: { isActive: false },
    where: { id: checkoutPageId },
  });
}

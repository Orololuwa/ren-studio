import type Stripe from "stripe";

import type { Route } from "./+types/stripe.webhooks.checkout";
import { stripeAdmin } from "~/features/billing/stripe-admin.server";
import {
  updatePaymentStatusInDatabaseByProviderAndProviderPaymentId,
  upsertPaymentToDatabaseByProviderAndProviderPaymentId,
} from "~/features/checkout/payments-model.server";
import {
  generateReceiptForPaymentInDatabaseById,
  sendReceiptEmailForReceiptInDatabaseById,
} from "~/features/checkout/receipt-generation.server";
import type { Prisma } from "~/generated/client";
import { prisma } from "~/utils/database.server";
import { getErrorMessage } from "~/utils/get-error-message";

/**
 * Checkout Session does not create a Payment row up front (only after PI
 * succeeds). Payment Element flow creates the row when the PI is created.
 */
async function upsertPaymentRecordFromStripePaymentIntentIfMissing(
  pi: Stripe.PaymentIntent,
) {
  const checkoutPageId = pi.metadata?.checkoutPageId;
  if (!checkoutPageId) return;

  const existing = await prisma.payment.findUnique({
    where: {
      provider_providerPaymentId: {
        provider: "stripe",
        providerPaymentId: pi.id,
      },
    },
  });
  if (existing) return;

  if (pi.metadata?.source !== "stripe_checkout_session") return;

  const checkoutPage = await prisma.checkoutPage.findUnique({
    where: { id: checkoutPageId },
  });
  if (!checkoutPage?.isActive) return;

  if (
    pi.metadata.organizationId &&
    pi.metadata.organizationId !== checkoutPage.organizationId
  ) {
    return;
  }

  let items: unknown[] = [];
  if (pi.metadata.itemsJson) {
    try {
      items = JSON.parse(pi.metadata.itemsJson) as unknown[];
    } catch {
      items = [];
    }
  }

  const customerEmail = pi.metadata.customerEmail ?? pi.receipt_email ?? "";
  if (!customerEmail) return;

  const customerName = pi.metadata.customerName || null;

  await upsertPaymentToDatabaseByProviderAndProviderPaymentId({
    provider: "stripe",
    providerPaymentId: pi.id,
    create: {
      amountMinor: pi.amount,
      checkoutPage: { connect: { id: checkoutPage.id } },
      currency: pi.currency.toUpperCase(),
      customerEmail,
      customerName,
      customerPhone: null,
      items: items as unknown as Prisma.InputJsonValue,
      metadata: {
        stripe: { paymentIntentId: pi.id },
      } as unknown as Prisma.InputJsonValue,
      provider: "stripe",
      providerCustomerId: typeof pi.customer === "string" ? pi.customer : null,
      providerPaymentId: pi.id,
      status: "pending",
    },
    update: {
      amountMinor: pi.amount,
      currency: pi.currency.toUpperCase(),
      customerEmail,
      customerName,
      customerPhone: null,
      items: items as unknown as Prisma.InputJsonValue,
      status: "pending",
    },
  });
}

const json = (payload: unknown, init?: ResponseInit) =>
  Response.json(payload, {
    status: 200,
    ...init,
  });

const notAllowed = () =>
  json({ message: "Method Not Allowed" }, { status: 405 });

const badRequest = (payload?: { message?: string; error?: string }) =>
  json({ message: "Bad Request", ...payload }, { status: 400 });

export const loader = () => notAllowed();

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return notAllowed();

  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return badRequest({ message: "Missing stripe-signature header" });

  const payload = await request.text();
  const secret =
    process.env.STRIPE_WEBHOOK_SECRET_CHECKOUT ??
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return badRequest({ message: "Missing Stripe webhook secret" });
  }

  try {
    const event = stripeAdmin.webhooks.constructEvent(
      payload,
      signature,
      secret,
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const providerPaymentId = pi.id;

        await upsertPaymentRecordFromStripePaymentIntentIfMissing(pi);

        const payment = await prisma.payment.findUnique({
          where: {
            provider_providerPaymentId: {
              provider: "stripe",
              providerPaymentId,
            },
          },
          select: { id: true, checkoutPageId: true, amountMinor: true },
        });

        if (!payment) {
          return json({ message: "OK" });
        }

        await updatePaymentStatusInDatabaseByProviderAndProviderPaymentId({
          provider: "stripe",
          providerPaymentId,
          status: "succeeded",
        });

        await prisma.checkoutPage.update({
          data: {
            paymentCount: { increment: 1 },
            totalRevenueMinor: { increment: payment.amountMinor },
          },
          where: { id: payment.checkoutPageId },
        });

        const receipt = await generateReceiptForPaymentInDatabaseById({
          paymentId: payment.id,
        });
        if (receipt) {
          await sendReceiptEmailForReceiptInDatabaseById({
            receiptId: receipt.id,
          });
        }

        return json({ message: "OK" });
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const row = await prisma.payment.findUnique({
          where: {
            provider_providerPaymentId: {
              provider: "stripe",
              providerPaymentId: pi.id,
            },
          },
          select: { id: true },
        });
        if (row) {
          await updatePaymentStatusInDatabaseByProviderAndProviderPaymentId({
            provider: "stripe",
            providerPaymentId: pi.id,
            status: "failed",
          });
        }
        return json({ message: "OK" });
      }

      case "payment_intent.canceled": {
        const pi = event.data.object;
        const row = await prisma.payment.findUnique({
          where: {
            provider_providerPaymentId: {
              provider: "stripe",
              providerPaymentId: pi.id,
            },
          },
          select: { id: true },
        });
        if (row) {
          await updatePaymentStatusInDatabaseByProviderAndProviderPaymentId({
            provider: "stripe",
            providerPaymentId: pi.id,
            status: "canceled",
          });
        }
        return json({ message: "OK" });
      }

      default:
        return json({ message: "OK" });
    }
  } catch (error) {
    return badRequest({ error: `Webhook Error: ${getErrorMessage(error)}` });
  }
}

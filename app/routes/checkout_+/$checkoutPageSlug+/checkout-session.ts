import { data } from "react-router";
import { z } from "zod";

import type { Route } from "./+types/checkout-session";
import { stripeAdmin } from "~/features/billing/stripe-admin.server";
import { retrieveCheckoutPageFromDatabaseBySlug } from "~/features/checkout/checkout-pages-model.server";
import { toMinorUnits } from "~/features/checkout/money";
import { notFound } from "~/utils/http-responses.server";

const schema = z.object({
  provider: z.literal("stripe"),
  amountMajor: z.string(),
  currency: z.string().min(3),
  items: z
    .union([z.array(z.any()), z.string()])
    .optional()
    .transform((val) => {
      if (!val) return [];
      if (typeof val === "string") return JSON.parse(val) as unknown[];
      return val;
    }),
  customerEmail: z.string().email(),
  customerName: z.string().optional().default(""),
});

function itemsMetadataValue(items: unknown[]): string | undefined {
  try {
    const s = JSON.stringify(items);
    if (s.length <= 450) return s;
  } catch {
    /* ignore */
  }
  return undefined;
}

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ message: "Method Not Allowed" }, { status: 405 });
  }

  const checkoutPage = await retrieveCheckoutPageFromDatabaseBySlug({
    slug: params.checkoutPageSlug,
  });
  if (!checkoutPage || !checkoutPage.isActive) {
    throw notFound();
  }
  if (!checkoutPage.paymentProviders.includes("stripe")) {
    return data(
      { error: "Stripe is not enabled for this checkout page" },
      { status: 400 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = await schema.safeParseAsync(payload);
  if (!parsed.success) {
    return data({ error: parsed.error.flatten() }, { status: 400 });
  }

  const currency = parsed.data.currency.toUpperCase();
  if (!checkoutPage.allowedCurrencies.includes(currency)) {
    return data({ error: "Currency not allowed" }, { status: 400 });
  }

  const amountMinor = toMinorUnits({
    amountMajor: parsed.data.amountMajor,
    currency,
  });

  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) {
    return data(
      { error: "APP_URL is not configured on the server" },
      { status: 500 },
    );
  }

  const slug = params.checkoutPageSlug;
  const items = (parsed.data.items ?? []) as unknown[];
  const itemsJson = itemsMetadataValue(items);

  const paymentIntentMetadata: Record<string, string> = {
    checkoutPageId: checkoutPage.id,
    customerEmail: parsed.data.customerEmail,
    organizationId: checkoutPage.organizationId,
    source: "stripe_checkout_session",
  };
  if (parsed.data.customerName) {
    paymentIntentMetadata.customerName = parsed.data.customerName;
  }
  if (itemsJson) {
    paymentIntentMetadata.itemsJson = itemsJson;
  }

  const session = await stripeAdmin.checkout.sessions.create({
    cancel_url: `${appUrl}/checkout/${slug}`,
    customer_email: parsed.data.customerEmail,
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: checkoutPage.name || "Payment",
          },
          unit_amount: amountMinor,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_intent_data: {
      metadata: paymentIntentMetadata,
      receipt_email: parsed.data.customerEmail,
    },
    success_url: `${appUrl}/checkout/${slug}/payment-complete?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!session.url) {
    return data(
      { error: "Stripe did not return a checkout URL" },
      { status: 502 },
    );
  }

  return data({
    sessionId: session.id,
    url: session.url,
  });
}

import type { Route } from "./+types/stripe.webhooks.checkout";
import { stripeAdmin } from "~/features/billing/stripe-admin.server";
import {
  handleStripeCheckoutPaymentIntentCanceled,
  handleStripeCheckoutPaymentIntentFailed,
  handleStripeCheckoutPaymentIntentSucceeded,
} from "~/features/checkout/stripe-checkout-webhook.server";
import { getErrorMessage } from "~/utils/get-error-message";

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
        await handleStripeCheckoutPaymentIntentSucceeded(event.data.object);
        return json({ message: "OK" });
      }

      case "payment_intent.payment_failed": {
        await handleStripeCheckoutPaymentIntentFailed(event.data.object);
        return json({ message: "OK" });
      }

      case "payment_intent.canceled": {
        await handleStripeCheckoutPaymentIntentCanceled(event.data.object);
        return json({ message: "OK" });
      }

      default:
        return json({ message: "OK" });
    }
  } catch (error) {
    return badRequest({ error: `Webhook Error: ${getErrorMessage(error)}` });
  }
}

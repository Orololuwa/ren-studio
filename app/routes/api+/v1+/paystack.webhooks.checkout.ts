import type { Route } from "./+types/paystack.webhooks.checkout";
import { updatePaymentStatusInDatabaseByProviderAndProviderPaymentId } from "~/features/checkout/payments-model.server";
import {
  verifyPaystackSignature,
  verifyPaystackTransaction,
} from "~/features/checkout/paystack.server";
import {
  generateReceiptForPaymentInDatabaseById,
  sendReceiptEmailForReceiptInDatabaseById,
} from "~/features/checkout/receipt-generation.server";
import { prisma } from "~/utils/database.server";
import { getErrorMessage } from "~/utils/get-error-message";

const json = (payload: unknown, init?: ResponseInit) =>
  Response.json(payload, { status: 200, ...init });

const notAllowed = () =>
  json({ message: "Method Not Allowed" }, { status: 405 });
const badRequest = (payload?: { message?: string; error?: string }) =>
  json({ message: "Bad Request", ...payload }, { status: 400 });

export const loader = () => notAllowed();

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return notAllowed();

  const payload = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  try {
    if (!verifyPaystackSignature({ payload, signature })) {
      return badRequest({ message: "Invalid signature" });
    }

    const body = JSON.parse(payload) as {
      event?: string;
      data?: { reference?: string };
    };
    const eventType = body.event;
    const reference = body.data?.reference;

    if (!eventType || !reference) {
      return badRequest({ message: "Missing event or reference" });
    }

    if (eventType === "charge.success") {
      const verified = await verifyPaystackTransaction({ reference });
      if (verified.status !== "success") {
        await updatePaymentStatusInDatabaseByProviderAndProviderPaymentId({
          provider: "paystack",
          providerPaymentId: reference,
          status: "failed",
        });
        return json({ message: "OK" });
      }

      const payment = await prisma.payment.findUnique({
        where: {
          provider_providerPaymentId: {
            provider: "paystack",
            providerPaymentId: reference,
          },
        },
        select: { id: true, checkoutPageId: true, amountMinor: true },
      });

      await updatePaymentStatusInDatabaseByProviderAndProviderPaymentId({
        provider: "paystack",
        providerPaymentId: reference,
        status: "succeeded",
        data: {
          providerCustomerId: verified.customer?.email ?? null,
        },
      });

      if (payment) {
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
      }

      return json({ message: "OK" });
    }

    if (eventType === "charge.failed") {
      await updatePaymentStatusInDatabaseByProviderAndProviderPaymentId({
        provider: "paystack",
        providerPaymentId: reference,
        status: "failed",
      });
      return json({ message: "OK" });
    }

    return json({ message: "OK" });
  } catch (error) {
    return badRequest({ error: getErrorMessage(error) });
  }
}

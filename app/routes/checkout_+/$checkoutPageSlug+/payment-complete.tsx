import { data, Link, useSearchParams } from "react-router";

import type { Route } from "./+types/payment-complete";
import { Button } from "~/components/ui/button";
import { retrieveCheckoutPageFromDatabaseBySlug } from "~/features/checkout/checkout-pages-model.server";
import { notFound } from "~/utils/http-responses.server";

export async function loader({ params }: Route.LoaderArgs) {
  const checkoutPage = await retrieveCheckoutPageFromDatabaseBySlug({
    slug: params.checkoutPageSlug,
  });
  if (!checkoutPage || !checkoutPage.isActive) {
    throw notFound();
  }
  return data({
    checkoutPageSlug: checkoutPage.slug,
    pageName: checkoutPage.name,
  });
}

export default function CheckoutPaymentCompleteRoute({
  loaderData,
}: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const redirectStatus = searchParams.get("redirect_status");
  /** Stripe Checkout: `session_id`. Paystack callback: `reference` and usually `trxref`. */
  const paystackReturn =
    Boolean(searchParams.get("reference")) ||
    Boolean(searchParams.get("trxref"));
  const succeeded =
    redirectStatus === "succeeded" ||
    Boolean(searchParams.get("session_id")) ||
    paystackReturn;
  const failed =
    redirectStatus === "failed" ||
    redirectStatus === "canceled" ||
    redirectStatus === "cancelled";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        {succeeded ? (
          <>
            <h1 className="text-xl font-semibold">Payment successful</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Thank you for your payment
              {loaderData.pageName ? ` — ${loaderData.pageName}` : ""}.
            </p>
          </>
        ) : failed ? (
          <>
            <h1 className="text-xl font-semibold">
              Payment could not be completed
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {redirectStatus
                ? `Status: ${redirectStatus}. You can try again from the checkout page.`
                : "Something went wrong. You can try again from the checkout page."}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Payment</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              If you completed a payment, you should receive a confirmation
              email. Otherwise return to checkout to try again.
            </p>
          </>
        )}
        <Button asChild className="mt-6 w-full" variant="outline">
          <Link to={`/checkout/${loaderData.checkoutPageSlug}`}>
            Back to checkout
          </Link>
        </Button>
      </div>
    </div>
  );
}

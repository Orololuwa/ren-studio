import * as React from "react";
import { z } from "zod";

import type {
  CheckoutLineItem,
  CheckoutPaymentFormData,
} from "../checkout-sections";
import { computeCheckoutOrderTotalMajorFromLineItems } from "../checkout-sections";
import { formatMinorUnits, toMinorUnits } from "../money";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { getCommonCurrencyLabel } from "~/features/templates/shared/common-currencies";

const emailSchema = z.object({
  email: z.string().email(),
});

function validatePayClick(
  email: string,
  orderTotalMajor: string,
): string | null {
  const n = Number(orderTotalMajor);
  if (!Number.isFinite(n) || n <= 0) {
    return "This checkout has no payable total. Add products or fix line items.";
  }
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return "Enter a valid email address.";
  }
  return null;
}

export type CheckoutPaymentSectionComponentProps = {
  checkoutPageSlug: string;
  paymentProviders: string[];
  /** Used by the page config; the payment UI only displays `values.currency`. */
  paymentForm: CheckoutPaymentFormData;
  products: CheckoutLineItem[];
  values: {
    email: string;
    name: string;
    currency: string;
  };
  onChange: (v: CheckoutPaymentSectionComponentProps["values"]) => void;
  /** When true (e.g. split layout sidebar), fields stack in one column at all breakpoints. */
  fieldsSingleColumn?: boolean;
};

function buildPaymentItems(products: CheckoutLineItem[]) {
  return products.map((p) => ({
    description: p.description,
    quantity: p.quantity,
    unitPrice: p.unitPrice,
    total: p.total,
  }));
}

function readErrorFromJson(json: unknown): string {
  if (!json || typeof json !== "object") return "Could not start payment.";
  const o = json as Record<string, unknown>;
  if (typeof o.error === "string") return o.error;
  if (typeof o.message === "string") return o.message;
  if (o.error && typeof o.error === "object") {
    return "Check your payment details and try again.";
  }
  return "Could not start payment.";
}

function formatOrderTotalLabel(orderTotalMajor: string, currency: string) {
  const n = Number(orderTotalMajor);
  if (!Number.isFinite(n) || n < 0) return "—";
  const upper = currency.trim().toUpperCase();
  if (n === 0) {
    return formatMinorUnits({ amountMinor: 0, currency: upper });
  }
  return formatMinorUnits({
    amountMinor: toMinorUnits({
      amountMajor: orderTotalMajor,
      currency: upper,
    }),
    currency: upper,
  });
}

/**
 * Stripe Checkout (hosted page at checkout.stripe.com), same idea as Paystack’s
 * redirect — not Payment Element / clientSecret on your own domain.
 */
function StripeHostedCheckoutButton({
  checkoutPageSlug,
  values,
  items,
  orderTotalMajor,
  payDisabled,
}: {
  checkoutPageSlug: string;
  values: CheckoutPaymentSectionComponentProps["values"];
  items: ReturnType<typeof buildPaymentItems>;
  orderTotalMajor: string;
  payDisabled: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const pay = async () => {
    setError(null);
    const msg = validatePayClick(values.email, orderTotalMajor);
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/checkout/${checkoutPageSlug}/checkout-session`,
        {
          body: JSON.stringify({
            provider: "stripe",
            amountMajor: orderTotalMajor,
            currency: values.currency,
            customerEmail: values.email,
            customerName: values.name,
            items,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        setError(readErrorFromJson(json));
        return;
      }
      if (
        json &&
        typeof json === "object" &&
        "url" in json &&
        typeof (json as { url: unknown }).url === "string"
      ) {
        window.location.href = (json as { url: string }).url;
        return;
      }
      setError("Stripe did not return a checkout URL.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        disabled={loading || payDisabled}
        onClick={pay}
        type="button"
        variant="default"
      >
        {loading ? "Redirecting…" : "Pay with Stripe"}
      </Button>
      <p className="text-muted-foreground text-xs">
        Opens Stripe’s secure payment page to complete your card payment.
      </p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}

function PaystackCheckoutButton({
  checkoutPageSlug,
  values,
  items,
  orderTotalMajor,
  payDisabled,
}: {
  checkoutPageSlug: string;
  values: CheckoutPaymentSectionComponentProps["values"];
  items: ReturnType<typeof buildPaymentItems>;
  orderTotalMajor: string;
  payDisabled: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const pay = async () => {
    setError(null);
    const msg = validatePayClick(values.email, orderTotalMajor);
    if (msg) {
      setError(msg);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/checkout/${checkoutPageSlug}/paystack/payment`,
        {
          body: JSON.stringify({
            provider: "paystack",
            amountMajor: orderTotalMajor,
            currency: values.currency,
            customerEmail: values.email,
            customerName: values.name,
            items,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        setError(readErrorFromJson(json));
        return;
      }
      if (
        json &&
        typeof json === "object" &&
        "authorizationUrl" in json &&
        typeof (json as { authorizationUrl: unknown }).authorizationUrl ===
          "string"
      ) {
        window.location.href = (
          json as { authorizationUrl: string }
        ).authorizationUrl;
        return;
      }
      setError("Invalid response from Paystack.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        disabled={loading || payDisabled}
        onClick={pay}
        type="button"
        variant="default"
      >
        {loading ? "Redirecting…" : "Pay with Paystack"}
      </Button>
      <p className="text-muted-foreground text-xs">
        Redirects to Paystack’s hosted page to complete payment (currency must
        match what your Paystack account supports).
      </p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}

export function CheckoutPaymentSection({
  checkoutPageSlug,
  paymentProviders,
  paymentForm: _paymentForm,
  products,
  values,
  onChange,
  fieldsSingleColumn = false,
}: CheckoutPaymentSectionComponentProps) {
  const items = React.useMemo(() => buildPaymentItems(products), [products]);

  const orderTotalMajor = React.useMemo(
    () => computeCheckoutOrderTotalMajorFromLineItems(products),
    [products],
  );

  const orderTotalLabel = React.useMemo(
    () => formatOrderTotalLabel(orderTotalMajor, values.currency),
    [orderTotalMajor, values.currency],
  );

  const available = React.useMemo(() => {
    const set = new Set(paymentProviders);
    return {
      paystack: set.has("paystack"),
      stripe: set.has("stripe"),
    };
  }, [paymentProviders]);

  const [provider, setProvider] = React.useState<"stripe" | "paystack">(() =>
    available.stripe ? "stripe" : "paystack",
  );

  React.useEffect(() => {
    if (provider === "stripe" && !available.stripe && available.paystack) {
      setProvider("paystack");
    }
    if (provider === "paystack" && !available.paystack && available.stripe) {
      setProvider("stripe");
    }
  }, [available.paystack, available.stripe, provider]);

  const showProviderChoice = available.stripe && available.paystack;

  const payableTotal = Number(orderTotalMajor);
  const canPay =
    Number.isFinite(payableTotal) && payableTotal > 0 && products.length > 0;

  if (!available.stripe && !available.paystack) {
    return (
      <p className="text-muted-foreground text-sm">
        No payment providers are enabled for this page.
      </p>
    );
  }

  const fieldGridClass = fieldsSingleColumn
    ? "grid gap-4 grid-cols-1"
    : "grid gap-4 md:grid-cols-2";

  return (
    <section className="space-y-4">
      <div className={fieldGridClass}>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            onChange={(e) => onChange({ ...values, email: e.target.value })}
            placeholder="customer@example.com"
            value={values.email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerName">Name (optional)</Label>
          <Input
            id="customerName"
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            placeholder="John Doe"
            value={values.name}
          />
        </div>
      </div>
      <div className={fieldGridClass}>
        <div className="space-y-2">
          <Label>Total</Label>
          <p className="text-sm font-medium rounded-md border border-input bg-muted/30 px-3 py-2">
            {orderTotalLabel}
          </p>
          <p className="text-muted-foreground text-xs">
            From your line items (quantity × unit price).
          </p>
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <p className="text-sm font-medium rounded-md border border-input bg-muted/30 px-3 py-2">
            {getCommonCurrencyLabel(values.currency)}
          </p>
        </div>
      </div>

      {!canPay ? (
        <p className="text-destructive text-sm">
          {products.length === 0
            ? "There are no products to pay for."
            : "Order total must be greater than zero to pay."}
        </p>
      ) : null}

      {showProviderChoice ? (
        <div className="space-y-2">
          <Label>Payment method</Label>
          <RadioGroup
            className="flex flex-wrap gap-4"
            onValueChange={(v) => setProvider(v as "stripe" | "paystack")}
            value={provider}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="pay-stripe" value="stripe" />
              <Label className="font-normal" htmlFor="pay-stripe">
                Stripe (hosted checkout)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="pay-paystack" value="paystack" />
              <Label className="font-normal" htmlFor="pay-paystack">
                Paystack
              </Label>
            </div>
          </RadioGroup>
        </div>
      ) : null}

      {available.stripe && (!showProviderChoice || provider === "stripe") ? (
        <StripeHostedCheckoutButton
          checkoutPageSlug={checkoutPageSlug}
          items={items}
          orderTotalMajor={orderTotalMajor}
          payDisabled={!canPay}
          values={values}
        />
      ) : null}

      {available.paystack &&
      (!showProviderChoice || provider === "paystack") ? (
        <PaystackCheckoutButton
          checkoutPageSlug={checkoutPageSlug}
          items={items}
          orderTotalMajor={orderTotalMajor}
          payDisabled={!canPay}
          values={values}
        />
      ) : null}
    </section>
  );
}

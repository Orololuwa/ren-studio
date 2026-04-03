import * as React from "react";
import { z } from "zod";

import type {
  CheckoutLineItem,
  CheckoutPaymentFormData,
} from "../checkout-sections";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { getCommonCurrencyLabel } from "~/features/templates/shared/common-currencies";

const paymentStartSchema = z.object({
  email: z.string().email(),
  amountMajor: z.string().refine((s) => {
    const n = Number(s);
    return Number.isFinite(n) && n > 0;
  }),
});

export type CheckoutPaymentSectionComponentProps = {
  checkoutPageSlug: string;
  paymentProviders: string[];
  /** Used by the page config; the payment UI only displays `values.currency`. */
  paymentForm: CheckoutPaymentFormData;
  products: CheckoutLineItem[];
  values: {
    email: string;
    name: string;
    amountMajor: string;
    currency: string;
  };
  onChange: (v: CheckoutPaymentSectionComponentProps["values"]) => void;
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

/**
 * Stripe Checkout (hosted page at checkout.stripe.com), same idea as Paystack’s
 * redirect — not Payment Element / clientSecret on your own domain.
 */
function StripeHostedCheckoutButton({
  checkoutPageSlug,
  values,
  items,
}: {
  checkoutPageSlug: string;
  values: CheckoutPaymentSectionComponentProps["values"];
  items: ReturnType<typeof buildPaymentItems>;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const pay = async () => {
    setError(null);
    const parsed = paymentStartSchema.safeParse({
      email: values.email,
      amountMajor: values.amountMajor,
    });
    if (!parsed.success) {
      setError("Enter a valid email and a positive amount.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/checkout/${checkoutPageSlug}/checkout-session`,
        {
          body: JSON.stringify({
            provider: "stripe",
            amountMajor: values.amountMajor,
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
      <Button disabled={loading} onClick={pay} type="button" variant="default">
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
}: {
  checkoutPageSlug: string;
  values: CheckoutPaymentSectionComponentProps["values"];
  items: ReturnType<typeof buildPaymentItems>;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const pay = async () => {
    setError(null);
    const parsed = paymentStartSchema.safeParse({
      email: values.email,
      amountMajor: values.amountMajor,
    });
    if (!parsed.success) {
      setError("Enter a valid email and a positive amount.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/checkout/${checkoutPageSlug}/paystack/payment`,
        {
          body: JSON.stringify({
            provider: "paystack",
            amountMajor: values.amountMajor,
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
      <Button disabled={loading} onClick={pay} type="button" variant="default">
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
}: CheckoutPaymentSectionComponentProps) {
  const items = React.useMemo(() => buildPaymentItems(products), [products]);

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

  if (!available.stripe && !available.paystack) {
    return (
      <p className="text-muted-foreground text-sm">
        No payment providers are enabled for this page.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            inputMode="decimal"
            onChange={(e) =>
              onChange({ ...values, amountMajor: e.target.value })
            }
            placeholder="100.00"
            value={values.amountMajor}
          />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <p className="text-sm font-medium rounded-md border border-input bg-muted/30 px-3 py-2">
            {getCommonCurrencyLabel(values.currency)}
          </p>
        </div>
      </div>

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
          values={values}
        />
      ) : null}

      {available.paystack &&
      (!showProviderChoice || provider === "paystack") ? (
        <PaystackCheckoutButton
          checkoutPageSlug={checkoutPageSlug}
          items={items}
          values={values}
        />
      ) : null}
    </section>
  );
}

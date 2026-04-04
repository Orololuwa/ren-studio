import bcrypt from "bcryptjs";
import { BadgeCheckIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import { data, useFetcher } from "react-router";
import { z } from "zod";

import type { Route } from "./+types/_index";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  retrieveCheckoutPageFromDatabaseBySlug,
  updateCheckoutPageInDatabase,
} from "~/features/checkout/checkout-pages-model.server";
import { parseCheckoutSections } from "~/features/checkout/checkout-sections";
import { CheckoutPageRenderer } from "~/features/checkout/components/checkout-page-renderer";
import {
  getCheckoutAccessSession,
  getIsCheckoutAccessValid,
  setCheckoutAccessSession,
} from "~/features/checkout/public-checkout-session.server";
import { notFound } from "~/utils/http-responses.server";
import { validateFormData } from "~/utils/validate-form-data.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  const checkoutPage = await retrieveCheckoutPageFromDatabaseBySlug({
    slug: params.checkoutPageSlug,
  });

  if (!checkoutPage) {
    throw notFound();
  }

  const session = await getCheckoutAccessSession(request);
  const hasAccess = getIsCheckoutAccessValid({
    checkoutPageSlug: checkoutPage.slug,
    session,
  });

  if (!checkoutPage.isActive) {
    return data({
      checkoutPage: {
        name: checkoutPage.name,
        slug: checkoutPage.slug,
      },
      checkoutState: "inactive" as const,
      hasAccess: true,
    });
  }

  const expiresAt = checkoutPage.expiresAt;
  const isExpired =
    expiresAt != null && new Date(expiresAt).getTime() <= Date.now();

  if (isExpired) {
    return data({
      checkoutPage: {
        name: checkoutPage.name,
        slug: checkoutPage.slug,
      },
      checkoutState: "expired" as const,
      hasAccess: true,
    });
  }

  // Best-effort view count increment (no hard failure).
  void updateCheckoutPageInDatabase({
    checkoutPageId: checkoutPage.id,
    organizationId: checkoutPage.organizationId,
    data: { viewCount: { increment: 1 } },
  });

  return data({
    checkoutPage: {
      id: checkoutPage.id,
      slug: checkoutPage.slug,
      name: checkoutPage.name,
      description: checkoutPage.description,
      sections: checkoutPage.sections,
      globalStyles: checkoutPage.globalStyles,
      colorPalette: checkoutPage.colorPalette,
      paymentProviders: checkoutPage.paymentProviders,
      defaultCurrency: checkoutPage.defaultCurrency,
      allowedCurrencies: checkoutPage.allowedCurrencies,
      isPasswordProtected: checkoutPage.isPasswordProtected,
      passwordHint: checkoutPage.passwordHint,
    },
    checkoutState: "open" as const,
    hasAccess,
  });
}

const verifyPasswordSchema = z.object({
  intent: z.literal("verify-password"),
  password: z.string().min(1),
});

export async function action({ request, params }: Route.ActionArgs) {
  const checkoutPage = await retrieveCheckoutPageFromDatabaseBySlug({
    slug: params.checkoutPageSlug,
  });

  if (!checkoutPage || !checkoutPage.isActive) {
    throw notFound();
  }

  if (
    checkoutPage.expiresAt &&
    new Date(checkoutPage.expiresAt).getTime() <= Date.now()
  ) {
    throw notFound();
  }

  const result = await validateFormData(request, verifyPasswordSchema);
  if (!result.success) return result.response;

  if (!checkoutPage.isPasswordProtected) {
    return data(
      { valid: true },
      {
        headers: {
          "Set-Cookie": await setCheckoutAccessSession({
            checkoutPageSlug: checkoutPage.slug,
          }),
        },
      },
    );
  }

  if (!checkoutPage.passwordHash) {
    return data({ valid: false }, { status: 401 });
  }

  const valid = await bcrypt.compare(
    result.data.password,
    checkoutPage.passwordHash,
  );
  if (!valid) {
    return data({ valid: false }, { status: 401 });
  }

  return data(
    { valid: true },
    {
      headers: {
        "Set-Cookie": await setCheckoutAccessSession({
          checkoutPageSlug: checkoutPage.slug,
        }),
      },
    },
  );
}

export default function PublicCheckoutRoute({
  loaderData,
}: Route.ComponentProps) {
  const fetcher = useFetcher<typeof action>();
  const { checkoutPage, hasAccess, checkoutState } = loaderData;

  const [password, setPassword] = React.useState("");

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [currency, setCurrency] = React.useState(
    checkoutState === "open" ? checkoutPage.defaultCurrency : "USD",
  );

  if (checkoutState === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <ClockIcon aria-hidden className="size-9 text-muted-foreground" />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            This checkout link has expired
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            The payment page for{" "}
            <span className="font-medium text-foreground">
              {checkoutPage.name}
            </span>{" "}
            is no longer available because its expiry date has passed. No new
            payment can be started from this link.
          </p>
          <p className="text-muted-foreground mt-4 text-xs text-pretty">
            If you still need to pay, ask the business for a new checkout link.
          </p>
        </div>
      </div>
    );
  }

  if (checkoutState === "inactive") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-500/15">
            <BadgeCheckIcon
              aria-hidden
              className="size-10 text-green-600 dark:text-green-400"
            />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            Payment complete
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            Thank you — your payment for{" "}
            <span className="font-medium text-foreground">
              {checkoutPage.name}
            </span>{" "}
            went through successfully. This one-time link has been closed and
            can&apos;t be used to pay again.
          </p>
          <p className="text-muted-foreground mt-4 text-xs text-pretty">
            You should have a confirmation email. Contact the business if you
            need another link or a copy of your receipt.
          </p>
        </div>
      </div>
    );
  }

  if (checkoutPage.isPasswordProtected && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm">
          <h1 className="text-xl font-semibold">{checkoutPage.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            This checkout is password protected.
          </p>

          <fetcher.Form className="mt-6 space-y-4" method="post">
            <input name="intent" type="hidden" value="verify-password" />
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoFocus
                id="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                value={password}
              />
              {checkoutPage.passwordHint ? (
                <p className="text-muted-foreground text-xs">
                  Hint: {checkoutPage.passwordHint}
                </p>
              ) : null}
            </div>
            <Button className="w-full" type="submit">
              Access checkout
            </Button>
            {fetcher.data &&
            "valid" in fetcher.data &&
            fetcher.data.valid === false ? (
              <p className="text-sm text-destructive">Incorrect password.</p>
            ) : null}
          </fetcher.Form>
        </div>
      </div>
    );
  }

  const parsed = parseCheckoutSections(
    checkoutPage.sections,
    checkoutPage.globalStyles,
    {
      storeName: checkoutPage.name,
      defaultCurrency: checkoutPage.defaultCurrency,
      allowedCurrencies: checkoutPage.allowedCurrencies,
    },
  );

  return (
    <div className="min-h-screen px-4 py-10">
      <CheckoutPageRenderer
        checkoutPageSlug={checkoutPage.slug}
        description={checkoutPage.description ?? undefined}
        header={{
          backgroundColor: parsed.header.backgroundColor,
          storeLogo: parsed.header.storeLogo,
          storeName: parsed.header.storeName,
          textColor: parsed.header.textColor,
        }}
        layout={parsed.layout}
        onPaymentFormChange={(v) => {
          setEmail(v.email);
          setName(v.name);
          setCurrency(v.currency);
        }}
        orderTotals={parsed.totals}
        pageName={checkoutPage.name}
        paymentForm={parsed.paymentForm}
        paymentFormValues={{ email, name, currency }}
        paymentProviders={checkoutPage.paymentProviders}
        products={parsed.items}
      />
    </div>
  );
}

import bcrypt from "bcryptjs";
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

  if (!checkoutPage || !checkoutPage.isActive) {
    throw notFound();
  }

  if (
    checkoutPage.expiresAt &&
    new Date(checkoutPage.expiresAt).getTime() <= Date.now()
  ) {
    throw notFound();
  }

  const session = await getCheckoutAccessSession(request);
  const hasAccess = getIsCheckoutAccessValid({
    checkoutPageSlug: checkoutPage.slug,
    session,
  });

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
  const { checkoutPage, hasAccess } = loaderData;

  const [password, setPassword] = React.useState("");

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [amountMajor, setAmountMajor] = React.useState("");
  const [currency, setCurrency] = React.useState(checkoutPage.defaultCurrency);

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
          setAmountMajor(v.amountMajor);
          setCurrency(v.currency);
        }}
        pageName={checkoutPage.name}
        paymentForm={parsed.paymentForm}
        paymentFormValues={{ email, name, amountMajor, currency }}
        paymentProviders={checkoutPage.paymentProviders}
        products={parsed.items}
      />
    </div>
  );
}

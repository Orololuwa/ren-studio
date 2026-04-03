import * as React from "react";

import type {
  CheckoutLayout,
  CheckoutLineItem,
  CheckoutPaymentFormData,
} from "../checkout-sections";
import { CheckoutPaymentSection } from "./checkout-payment-section";

export interface CheckoutPageRendererHeader {
  storeName: string;
  storeLogo: string | null;
  backgroundColor: string | null;
  textColor?: string | null;
}

export interface CheckoutPageRendererProps {
  layout: CheckoutLayout;
  header: CheckoutPageRendererHeader;
  products: CheckoutLineItem[];
  description?: string;
  paymentForm: CheckoutPaymentFormData;
  /** Public checkout slug for payment API routes. */
  checkoutPageSlug: string;
  /** Enabled providers from the checkout page (e.g. stripe, paystack). */
  paymentProviders: string[];
  pageName?: string;
  /** When true, renders a read-only preview (e.g. in wizard). Payment form is placeholder. */
  previewMode?: boolean;
  /** Optional: controlled values for payment form when not in preview mode */
  paymentFormValues?: {
    email: string;
    name: string;
    amountMajor: string;
    currency: string;
  };
  onPaymentFormChange?: (values: {
    email: string;
    name: string;
    amountMajor: string;
    currency: string;
  }) => void;
}

function CheckoutHeader({
  header,
  pageName,
}: {
  header: CheckoutPageRendererHeader;
  pageName?: string;
}) {
  const bg = header.backgroundColor ?? "#ffffff";
  const color = header.textColor ?? undefined;
  return (
    <header
      className="flex flex-col items-center gap-3 px-4 py-6 text-center"
      style={{ backgroundColor: bg, color }}
    >
      {header.storeLogo ? (
        <img
          alt="Store logo"
          className="h-12 w-auto object-contain"
          src={header.storeLogo}
        />
      ) : null}
      <h1 className="text-xl font-semibold">{pageName ?? header.storeName}</h1>
    </header>
  );
}

function lineTotal(item: CheckoutLineItem): number {
  const q = Number(item.quantity);
  const p = Number(item.unitPrice);
  return (Number.isFinite(q) ? q : 0) * (Number.isFinite(p) ? p : 0);
}

function ProductsSummary({ products }: { products: CheckoutLineItem[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        No products
      </div>
    );
  }
  const overallTotal = products.reduce((sum, item) => sum + lineTotal(item), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left font-medium py-2">Description</th>
            <th className="text-right font-medium py-2">Qty</th>
            <th className="text-right font-medium py-2">Unit price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item, idx) => (
            <tr className="border-b last:border-0" key={item.id ?? idx}>
              <td className="py-2">{item.description || "—"}</td>
              <td className="text-right py-2">{item.quantity}</td>
              <td className="text-right py-2">{item.unitPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex justify-end border-t pt-2 text-sm font-medium">
        Total: {overallTotal.toFixed(2)}
      </div>
    </div>
  );
}

function PaymentFormPlaceholder() {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
      Payment form (Stripe / Paystack) will appear here.
    </div>
  );
}

export function CheckoutPageRenderer({
  layout,
  header,
  products,
  description,
  paymentForm,
  checkoutPageSlug,
  paymentProviders,
  pageName,
  previewMode = false,
  paymentFormValues,
  onPaymentFormChange,
}: CheckoutPageRendererProps) {
  const [localValues, setLocalValues] = React.useState({
    email: "",
    name: "",
    amountMajor: "",
    currency: paymentForm.defaultCurrency,
  });
  const values = paymentFormValues ?? localValues;
  const setValues = onPaymentFormChange ?? setLocalValues;

  const content = (
    <>
      <CheckoutHeader header={header} pageName={pageName} />
      <div className="space-y-4 p-4">
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
        <div>
          <h2 className="text-sm font-medium mb-2">Products</h2>
          <ProductsSummary products={products} />
        </div>
        <div>
          <h2 className="text-sm font-medium mb-2">Payment</h2>
          {previewMode ? (
            <PaymentFormPlaceholder />
          ) : (
            <CheckoutPaymentSection
              checkoutPageSlug={checkoutPageSlug}
              onChange={setValues}
              paymentForm={paymentForm}
              paymentProviders={paymentProviders}
              products={products}
              values={values}
            />
          )}
        </div>
        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Secure checkout
        </footer>
      </div>
    </>
  );

  if (layout === "minimal") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl">{content}</div>
      </div>
    );
  }

  if (layout === "split") {
    return (
      <div className="min-h-screen bg-muted/20 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 items-start md:grid-cols-[2fr_1fr]">
            <div className="bg-transparent">
              <div className="overflow-hidden rounded-xl bg-background shadow-sm">
                <CheckoutHeader header={header} pageName={pageName} />
              </div>
              {description ? (
                <p className="text-muted-foreground text-sm mt-4">
                  {description}
                </p>
              ) : null}
              <div className="mt-4">
                <h2 className="text-sm font-medium mb-2">Products</h2>
                <div className="rounded-xl bg-background p-4 shadow-sm">
                  <ProductsSummary products={products} />
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-background p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Payment</h2>
              {previewMode ? (
                <PaymentFormPlaceholder />
              ) : (
                <CheckoutPaymentSection
                  checkoutPageSlug={checkoutPageSlug}
                  onChange={setValues}
                  paymentForm={paymentForm}
                  paymentProviders={paymentProviders}
                  products={products}
                  values={values}
                />
              )}
            </div>
          </div>
          <footer className="mt-6 text-center text-xs text-muted-foreground">
            Secure checkout
          </footer>
        </div>
      </div>
    );
  }

  // centered-card (default)
  return (
    <div className="min-h-screen bg-muted/20 px-4 py-6">
      <div className="mx-auto w-full max-w-xl rounded-xl border bg-background shadow-sm overflow-hidden">
        {content}
      </div>
    </div>
  );
}

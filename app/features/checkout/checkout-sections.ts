/**
 * Safe parsing helpers for CheckoutPage.sections and globalStyles.
 * Extracts typed data from unknown JSON with graceful fallbacks.
 */

export type CheckoutLayout = "centered-card" | "split" | "minimal";

export interface CheckoutHeaderData {
  storeName: string;
  storeLogo: string | null;
  backgroundColor: string | null;
  textColor?: string | null;
}

export interface CheckoutLineItem {
  id?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

export interface CheckoutPaymentFormData {
  providers: string[];
  defaultCurrency: string;
  allowedCurrencies: string[];
}

export interface ParsedCheckoutSections {
  header: CheckoutHeaderData & { backgroundColor: string | null };
  items: CheckoutLineItem[];
  paymentForm: CheckoutPaymentFormData;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function asString(x: unknown): string {
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  return "";
}

function asStringOrNull(x: unknown): string | null {
  const s = asString(x);
  return s.length > 0 ? s : null;
}

function asArray(x: unknown): unknown[] {
  return Array.isArray(x) ? x : [];
}

function parseLineItem(raw: unknown): CheckoutLineItem {
  if (!isRecord(raw)) {
    return { description: "", quantity: "1", unitPrice: "0", total: "0" };
  }
  return {
    id: asStringOrNull(raw.id) ?? undefined,
    description: asString(raw.description),
    quantity: asString(raw.quantity) || "1",
    unitPrice: asString(raw.unitPrice) || "0",
    total: asString(raw.total) || "0",
  };
}

/**
 * Extract checkout-header section data and styles.
 */
export function extractCheckoutHeader(
  sections: unknown,
  fallback: { storeName: string; storeLogo?: string | null },
): CheckoutHeaderData & { backgroundColor: string | null } {
  const arr = Array.isArray(sections) ? sections : [];
  const headerSection = arr.find(
    (s) =>
      isRecord(s) &&
      (s.type === "checkout-header" || s.id === "checkout-header"),
  );
  if (!isRecord(headerSection)) {
    return {
      storeName: fallback.storeName,
      storeLogo: fallback.storeLogo ?? null,
      backgroundColor: null,
      textColor: null,
    };
  }
  const data = isRecord(headerSection.data) ? headerSection.data : {};
  const styles = isRecord(headerSection.styles) ? headerSection.styles : {};
  return {
    storeName: asString(data.storeName) || fallback.storeName,
    storeLogo: asStringOrNull(data.storeLogo) ?? fallback.storeLogo ?? null,
    backgroundColor: asStringOrNull(styles.backgroundColor) ?? null,
    textColor: asStringOrNull(styles.color) ?? null,
  };
}

/**
 * Extract checkout-items section data.
 */
export function extractCheckoutItems(sections: unknown): CheckoutLineItem[] {
  const arr = Array.isArray(sections) ? sections : [];
  const itemsSection = arr.find(
    (s) =>
      isRecord(s) && (s.type === "checkout-items" || s.id === "checkout-items"),
  );
  if (!isRecord(itemsSection)) return [];
  const data = isRecord(itemsSection.data) ? itemsSection.data : {};
  const items = asArray(data.items);
  return items.map(parseLineItem);
}

/**
 * Extract checkout-payment-form section data.
 */
export function extractCheckoutPaymentForm(
  sections: unknown,
  fallback: { defaultCurrency: string; allowedCurrencies: string[] },
): CheckoutPaymentFormData {
  const arr = Array.isArray(sections) ? sections : [];
  const formSection = arr.find(
    (s) =>
      isRecord(s) &&
      (s.type === "checkout-payment-form" || s.id === "checkout-payment-form"),
  );
  if (!isRecord(formSection)) {
    return {
      providers: ["stripe"],
      defaultCurrency: fallback.defaultCurrency,
      allowedCurrencies: fallback.allowedCurrencies,
    };
  }
  const data = isRecord(formSection.data) ? formSection.data : {};
  const providersRaw = data.providers;
  const providers = Array.isArray(providersRaw)
    ? providersRaw.map((p) => asString(p)).filter(Boolean)
    : typeof providersRaw === "string"
      ? providersRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : ["stripe"];
  return {
    providers: providers.length > 0 ? providers : ["stripe"],
    defaultCurrency: asString(data.defaultCurrency) || fallback.defaultCurrency,
    allowedCurrencies: Array.isArray(data.allowedCurrencies)
      ? data.allowedCurrencies.map((c) => asString(c)).filter(Boolean)
      : typeof data.allowedCurrencies === "string"
        ? data.allowedCurrencies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : fallback.allowedCurrencies,
  };
}

/**
 * Extract layout from globalStyles.
 */
export function extractLayout(
  globalStyles: unknown,
  fallback: CheckoutLayout = "centered-card",
): CheckoutLayout {
  if (!isRecord(globalStyles)) return fallback;
  const layout = asString(globalStyles.layout);
  if (
    layout === "centered-card" ||
    layout === "split" ||
    layout === "minimal"
  ) {
    return layout;
  }
  return fallback;
}

/**
 * Parse all checkout sections and globalStyles into typed data.
 */
export function parseCheckoutSections(
  sections: unknown,
  globalStyles: unknown,
  fallback: {
    storeName: string;
    storeLogo?: string | null;
    defaultCurrency: string;
    allowedCurrencies: string[];
  },
): ParsedCheckoutSections & { layout: CheckoutLayout } {
  return {
    layout: extractLayout(globalStyles, "centered-card"),
    header: extractCheckoutHeader(sections, {
      storeName: fallback.storeName,
      storeLogo: fallback.storeLogo,
    }),
    items: extractCheckoutItems(sections),
    paymentForm: extractCheckoutPaymentForm(sections, {
      defaultCurrency: fallback.defaultCurrency,
      allowedCurrencies: fallback.allowedCurrencies,
    }),
  };
}

/**
 * Safe parsing helpers for CheckoutPage.sections and globalStyles.
 * Extracts typed data from unknown JSON with graceful fallbacks.
 */

import type { InvoiceItem } from "~/features/templates/shared/types";
import { recalculateFooterFromItems } from "~/features/templates/shared/utils/calculations";

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

/**
 * Order total in major units (string with 2 decimals), from quantity × unitPrice
 * per line — matches ProductsSummary / payment amount.
 */
export function computeCheckoutOrderTotalMajorFromLineItems(
  products: CheckoutLineItem[],
): string {
  const total = products.reduce((sum, item) => {
    const q = Number(item.quantity);
    const p = Number(item.unitPrice);
    return sum + (Number.isFinite(q) ? q : 0) * (Number.isFinite(p) ? p : 0);
  }, 0);
  return total.toFixed(2);
}

/** Mirrors invoice-footer totals: tax, discount, subtotal, grand total, terms, notes. */
export interface CheckoutTotalsData {
  taxMode: "percentage" | "amount";
  taxRate: string;
  taxAmount: string;
  showTaxRate: boolean;
  discountMode: "percentage" | "amount";
  discountRate: string;
  discount: string;
  showDiscountRate: boolean;
  subtotal: string;
  total: string;
  paymentTerms: string;
  notes: string;
}

export function defaultCheckoutTotals(): CheckoutTotalsData {
  return {
    taxMode: "percentage",
    taxRate: "0",
    taxAmount: "0.00",
    showTaxRate: true,
    discountMode: "percentage",
    discountRate: "0",
    discount: "0.00",
    showDiscountRate: true,
    subtotal: "0.00",
    total: "0.00",
    paymentTerms: "",
    notes: "",
  };
}

function parseTaxDiscountMode(
  raw: unknown,
  fallback: "percentage" | "amount",
): "percentage" | "amount" {
  return raw === "amount" ? "amount" : fallback;
}

/**
 * Normalizes persisted / invoice-footer-shaped data into {@link CheckoutTotalsData}.
 */
export function normalizeCheckoutTotalsInput(
  raw: Record<string, unknown>,
): CheckoutTotalsData {
  const d = defaultCheckoutTotals();
  return {
    ...d,
    taxMode: parseTaxDiscountMode(raw.taxMode, d.taxMode),
    taxRate: asString(raw.taxRate) || d.taxRate,
    taxAmount: asString(raw.taxAmount) || d.taxAmount,
    showTaxRate: raw.showTaxRate !== false,
    discountMode: parseTaxDiscountMode(raw.discountMode, d.discountMode),
    discountRate: asString(raw.discountRate) || d.discountRate,
    discount: asString(raw.discount) || d.discount,
    showDiscountRate: raw.showDiscountRate !== false,
    subtotal: asString(raw.subtotal) || d.subtotal,
    total: asString(raw.total) || d.total,
    paymentTerms: asString(raw.paymentTerms),
    notes: asString(raw.notes),
  };
}

/**
 * Recomputes subtotal, tax, discount, and total from line items using the same rules as invoice templates.
 */
export function recalculateCheckoutTotals(
  items: CheckoutLineItem[],
  base: CheckoutTotalsData,
): CheckoutTotalsData {
  const out = recalculateFooterFromItems(items as InvoiceItem[], {
    ...base,
  });
  return normalizeCheckoutTotalsInput(out);
}

/**
 * Amount to charge: line-sum only when no totals block exists (legacy checkouts); otherwise subtotal + tax − discount.
 */
export function computeCheckoutPayableTotalMajor(
  products: CheckoutLineItem[],
  totals: CheckoutTotalsData | null,
): string {
  if (!totals) {
    return computeCheckoutOrderTotalMajorFromLineItems(products);
  }
  return recalculateCheckoutTotals(products, totals).total;
}

function calcLineTotalFromQtyPrice(
  quantity: string,
  unitPrice: string,
): string {
  const q = Number(quantity);
  const p = Number(unitPrice);
  const total = (Number.isFinite(q) ? q : 0) * (Number.isFinite(p) ? p : 0);
  return total.toFixed(2);
}

export function withComputedLineTotals(
  items: CheckoutLineItem[],
): CheckoutLineItem[] {
  return items.map((item) => ({
    ...item,
    total: calcLineTotalFromQtyPrice(item.quantity, item.unitPrice),
  }));
}

/**
 * Parses manual wizard payload: legacy `[line, …]` or `{ items, totals }`.
 */
export function parseManualCheckoutItemsJson(itemsJson: string): {
  items: CheckoutLineItem[];
  totals: CheckoutTotalsData;
} | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(itemsJson);
  } catch {
    return null;
  }

  let rawItems: unknown[] = [];
  let totalsRaw: Record<string, unknown> | undefined;

  if (Array.isArray(parsed)) {
    rawItems = parsed;
  } else if (isRecord(parsed) && Array.isArray(parsed.items)) {
    rawItems = parsed.items;
    if (isRecord(parsed.totals)) {
      totalsRaw = parsed.totals;
    }
  } else {
    return null;
  }

  const items = withComputedLineTotals(rawItems.map(parseLineItem));
  const base = totalsRaw
    ? normalizeCheckoutTotalsInput(totalsRaw)
    : defaultCheckoutTotals();
  const totals = recalculateCheckoutTotals(items, base);
  return { items, totals };
}

export interface CheckoutPaymentFormData {
  providers: string[];
  defaultCurrency: string;
  allowedCurrencies: string[];
}

export interface ParsedCheckoutSections {
  header: CheckoutHeaderData & { backgroundColor: string | null };
  items: CheckoutLineItem[];
  /** When null, payable total is the sum of line items only (legacy pages). */
  totals: CheckoutTotalsData | null;
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

export function parseLineItem(raw: unknown): CheckoutLineItem {
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
 * Extract checkout totals (tax / discount / footer) from checkout-items section.
 */
export function extractCheckoutTotals(
  sections: unknown,
): CheckoutTotalsData | null {
  const arr = Array.isArray(sections) ? sections : [];
  const itemsSection = arr.find(
    (s) =>
      isRecord(s) && (s.type === "checkout-items" || s.id === "checkout-items"),
  );
  if (!isRecord(itemsSection)) return null;
  const data = isRecord(itemsSection.data) ? itemsSection.data : {};
  const totals = data.totals;
  if (!isRecord(totals)) return null;
  return normalizeCheckoutTotalsInput(totals);
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
    totals: extractCheckoutTotals(sections),
    paymentForm: extractCheckoutPaymentForm(sections, {
      defaultCurrency: fallback.defaultCurrency,
      allowedCurrencies: fallback.allowedCurrencies,
    }),
  };
}

/**
 * Shared list for template builder and checkout currency pickers.
 */
export const COMMON_CURRENCIES = [
  { code: "USD", name: "US Dollar ($)" },
  { code: "EUR", name: "Euro (€)" },
  { code: "GBP", name: "British Pound (£)" },
  { code: "JPY", name: "Japanese Yen (¥)" },
  { code: "CAD", name: "Canadian Dollar (C$)" },
  { code: "AUD", name: "Australian Dollar (A$)" },
  { code: "CHF", name: "Swiss Franc (CHF)" },
  { code: "CNY", name: "Chinese Yuan (¥)" },
  { code: "INR", name: "Indian Rupee (₹)" },
  { code: "BRL", name: "Brazilian Real (R$)" },
  { code: "MXN", name: "Mexican Peso (MX$)" },
  { code: "SGD", name: "Singapore Dollar (S$)" },
  { code: "HKD", name: "Hong Kong Dollar (HK$)" },
  { code: "NZD", name: "New Zealand Dollar (NZ$)" },
  { code: "SEK", name: "Swedish Krona (kr)" },
  { code: "NOK", name: "Norwegian Krone (kr)" },
  { code: "DKK", name: "Danish Krone (kr)" },
  { code: "PLN", name: "Polish Zloty (zł)" },
  { code: "RUB", name: "Russian Ruble (₽)" },
  { code: "NGN", name: "Nigerian Naira (₦)" },
  { code: "ZAR", name: "South African Rand (R)" },
  { code: "EGP", name: "Egyptian Pound (E£)" },
  { code: "KES", name: "Kenyan Shilling (KSh)" },
  { code: "GHS", name: "Ghanaian Cedi (₵)" },
  { code: "TZS", name: "Tanzanian Shilling (TSh)" },
  { code: "UGX", name: "Ugandan Shilling (USh)" },
  { code: "ETB", name: "Ethiopian Birr (Br)" },
  { code: "MAD", name: "Moroccan Dirham (د.م.)" },
  { code: "XOF", name: "West African CFA Franc (CFA)" },
  { code: "XAF", name: "Central African CFA Franc (FCFA)" },
] as const;

export function getCommonCurrencyLabel(code: string): string {
  const upper = code.trim().toUpperCase();
  const row = COMMON_CURRENCIES.find((c) => c.code === upper);
  return row ? row.name : upper;
}

/** Reads `globalStyles.currency` from a template (e.g. invoice). */
export function readCurrencyFromTemplateGlobalStyles(
  globalStyles: unknown,
): string | null {
  if (!globalStyles || typeof globalStyles !== "object") return null;
  const c = (globalStyles as Record<string, unknown>).currency;
  if (typeof c === "string" && c.trim().length >= 3) {
    return c.trim().toUpperCase();
  }
  return null;
}

/**
 * Currency to use for checkout when an invoice template does not set one in
 * `globalStyles` (e.g. legacy data).
 */
export function getCurrencyFromTemplateForCheckout(
  template: { globalStyles?: unknown } | null | undefined,
): string {
  return readCurrencyFromTemplateGlobalStyles(template?.globalStyles) ?? "USD";
}

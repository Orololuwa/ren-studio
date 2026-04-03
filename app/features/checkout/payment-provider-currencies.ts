/**
 * Paystack charge currencies supported by the API (ISO 4217).
 * @see https://paystack.com/docs/api/
 */
const PAYSTACK_SUPPORTED_CURRENCIES = new Set(["NGN"]);

export function isCurrencySupportedByPaystack(currency: string): boolean {
  return PAYSTACK_SUPPORTED_CURRENCIES.has(currency.trim().toUpperCase());
}

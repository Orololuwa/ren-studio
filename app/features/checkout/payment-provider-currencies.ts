/**
 * Paystack charge currencies supported by the API (ISO 4217).
 * @see https://paystack.com/docs/api/
 */
const PAYSTACK_SUPPORTED_CURRENCIES = new Set(["NGN"]);

/**
 * Stripe PaymentIntents support many ISO 4217 codes; we treat any 3-letter code
 * as supported so the wizard auto-selects Stripe whenever the currency is set.
 */
export function isCurrencySupportedByStripe(currency: string): boolean {
  return /^[A-Za-z]{3}$/.test(currency.trim());
}

export function isCurrencySupportedByPaystack(currency: string): boolean {
  return PAYSTACK_SUPPORTED_CURRENCIES.has(currency.trim().toUpperCase());
}

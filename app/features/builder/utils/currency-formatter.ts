/**
 * Formats a numeric value as currency using international formatting
 * @param value - The numeric value to format (can be string or number)
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  value: string | number | undefined | null,
  locale: string = "en-US",
  currency: string = "USD",
): string {
  if (value === null || value === undefined || value === "") {
    return formatCurrency(0, locale, currency);
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numValue)) {
    return formatCurrency(0, locale, currency);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Formats a numeric value as currency without the currency symbol
 * Useful for cases where the symbol is added separately
 * @param value - The numeric value to format (can be string or number)
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatCurrencyValue(
  value: string | number | undefined | null,
  locale: string = "en-US",
): string {
  if (value === null || value === undefined || value === "") {
    return formatCurrencyValue(0, locale);
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numValue)) {
    return formatCurrencyValue(0, locale);
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

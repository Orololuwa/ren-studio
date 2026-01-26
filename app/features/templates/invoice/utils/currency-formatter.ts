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

  // Use formatToParts to get better control over currency symbol display
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const parts = formatter.formatToParts(numValue);

  // Find currency symbol part
  const currencyPart = parts.find((part) => part.type === "currency");

  // If currency symbol exists and is not the code, use it
  if (currencyPart && currencyPart.value !== currency) {
    // Reconstruct with proper symbol
    return parts
      .map((part) => {
        if (part.type === "currency") {
          return currencyPart.value;
        }
        return part.value;
      })
      .join("");
  }

  // Fallback: try with a locale that's more likely to have the symbol
  // For African currencies, try using a locale from that region
  const localeMap: Record<string, string> = {
    NGN: "en-NG", // Nigerian English
    ZAR: "en-ZA", // South African English
    EGP: "ar-EG", // Egyptian Arabic
    KES: "en-KE", // Kenyan English
    GHS: "en-GH", // Ghanaian English
    TZS: "en-TZ", // Tanzanian English
    UGX: "en-UG", // Ugandan English
    ETB: "en-ET", // Ethiopian English
    MAD: "ar-MA", // Moroccan Arabic
  };

  const preferredLocale = localeMap[currency] || locale;

  try {
    const altFormatter = new Intl.NumberFormat(preferredLocale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const altParts = altFormatter.formatToParts(numValue);
    const altCurrencyPart = altParts.find((part) => part.type === "currency");

    if (altCurrencyPart && altCurrencyPart.value !== currency) {
      return altParts
        .map((part) => {
          if (part.type === "currency") {
            return altCurrencyPart.value;
          }
          return part.value;
        })
        .join("");
    }
  } catch {
    // If locale fails, continue with original
  }

  // Final fallback: use the original formatter
  return formatter.format(numValue);
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

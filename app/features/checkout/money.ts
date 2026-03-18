const currencyMinorUnitMap: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  VND: 0,
};

export function toMinorUnits({
  amountMajor,
  currency,
}: {
  amountMajor: string;
  currency: string;
}) {
  const normalizedCurrency = currency.toUpperCase();
  const exponent = currencyMinorUnitMap[normalizedCurrency] ?? 2;

  const n = Number(amountMajor);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid amount");
  }

  const factor = 10 ** exponent;
  return Math.round(n * factor);
}

export function formatMinorUnits({
  amountMinor,
  currency,
  locale = "en-US",
}: {
  amountMinor: number;
  currency: string;
  locale?: string;
}) {
  const normalizedCurrency = currency.toUpperCase();
  const exponent = currencyMinorUnitMap[normalizedCurrency] ?? 2;
  const amountMajor = amountMinor / 10 ** exponent;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalizedCurrency,
  }).format(amountMajor);
}

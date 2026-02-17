import { describe, expect, test } from "vitest";

import { formatCurrency, formatCurrencyValue } from "./currency-formatter";

describe("formatCurrency", () => {
  test("given: a positive number, should: format as USD currency by default", () => {
    const result = formatCurrency(1234.56);
    expect(result).toBe("$1,234.56");
  });

  test("given: zero, should: format as $0.00", () => {
    const result = formatCurrency(0);
    expect(result).toBe("$0.00");
  });

  test("given: null, should: default to $0.00", () => {
    const result = formatCurrency(null);
    expect(result).toBe("$0.00");
  });

  test("given: undefined, should: default to $0.00", () => {
    const result = formatCurrency(undefined);
    expect(result).toBe("$0.00");
  });

  test("given: an empty string, should: default to $0.00", () => {
    const result = formatCurrency("");
    expect(result).toBe("$0.00");
  });

  test("given: a numeric string, should: parse and format correctly", () => {
    const result = formatCurrency("1500.75");
    expect(result).toBe("$1,500.75");
  });

  test("given: a non-numeric string (NaN), should: default to $0.00", () => {
    const result = formatCurrency("not-a-number");
    expect(result).toBe("$0.00");
  });

  test("given: a negative number, should: format with negative sign", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("500.00");
    // Different locales may show negative as -$500.00 or ($500.00)
    expect(result).toMatch(/[-−(]?\$500\.00\)?/);
  });

  test("given: EUR currency, should: format with Euro symbol", () => {
    const result = formatCurrency(1234.56, "en-US", "EUR");
    expect(result).toContain("1,234.56");
    expect(result).toContain("€");
  });

  test("given: GBP currency, should: format with Pound symbol", () => {
    const result = formatCurrency(1234.56, "en-US", "GBP");
    expect(result).toContain("1,234.56");
    expect(result).toContain("£");
  });

  test("given: a small decimal value, should: format with two decimal places", () => {
    const result = formatCurrency(0.5);
    expect(result).toBe("$0.50");
  });

  test("given: a large number, should: format with comma separators", () => {
    const result = formatCurrency(1_000_000);
    expect(result).toBe("$1,000,000.00");
  });

  test("given: a string with leading zeros, should: parse correctly", () => {
    const result = formatCurrency("00100.50");
    expect(result).toBe("$100.50");
  });
});

describe("formatCurrencyValue", () => {
  test("given: a positive number, should: format without currency symbol", () => {
    const result = formatCurrencyValue(1234.56);
    expect(result).toBe("1,234.56");
  });

  test("given: zero, should: format as 0.00", () => {
    const result = formatCurrencyValue(0);
    expect(result).toBe("0.00");
  });

  test("given: null, should: default to 0.00", () => {
    const result = formatCurrencyValue(null);
    expect(result).toBe("0.00");
  });

  test("given: undefined, should: default to 0.00", () => {
    const result = formatCurrencyValue(undefined);
    expect(result).toBe("0.00");
  });

  test("given: an empty string, should: default to 0.00", () => {
    const result = formatCurrencyValue("");
    expect(result).toBe("0.00");
  });

  test("given: a non-numeric string (NaN), should: default to 0.00", () => {
    const result = formatCurrencyValue("abc");
    expect(result).toBe("0.00");
  });

  test("given: a numeric string, should: parse and format correctly", () => {
    const result = formatCurrencyValue("750.00");
    expect(result).toBe("750.00");
  });

  test("given: a large number, should: format with comma separators", () => {
    const result = formatCurrencyValue(1_000_000);
    expect(result).toBe("1,000,000.00");
  });
});

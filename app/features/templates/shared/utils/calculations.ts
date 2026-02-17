import type { InvoiceItem } from "../types";

/**
 * Calculates the subtotal from a list of invoice/receipt items.
 * Subtotal = sum of (quantity × unitPrice) for each item.
 *
 * @param items - Array of items with quantity and unitPrice
 * @returns The subtotal as a number
 */
export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => {
    const qty = Number.parseFloat(item.quantity || "0");
    const price = Number.parseFloat(item.unitPrice || "0");
    return sum + qty * price;
  }, 0);
}

/**
 * Calculates the tax amount based on the mode.
 *
 * In percentage mode: taxAmount = subtotal × (taxRate / 100)
 * In amount mode: the taxAmount is returned directly, but the rate is recalculated.
 *
 * @param subtotal - The subtotal amount
 * @param taxRate - The tax rate percentage (used in percentage mode)
 * @param taxAmount - The fixed tax amount (used in amount mode)
 * @param mode - "percentage" or "amount"
 * @returns An object with the calculated taxAmount and taxRate
 */
export function calculateTax(
  subtotal: number,
  taxRate: number,
  taxAmount: number,
  mode: "percentage" | "amount",
): { taxAmount: number; taxRate: number } {
  if (mode === "percentage") {
    const calculatedAmount =
      taxRate > 0 && subtotal > 0 ? (subtotal * taxRate) / 100 : taxAmount;
    return { taxAmount: calculatedAmount, taxRate };
  }

  // Amount mode: recalculate percentage from amount
  const calculatedRate =
    taxAmount > 0 && subtotal > 0 ? (taxAmount / subtotal) * 100 : taxRate;
  return { taxAmount, taxRate: calculatedRate };
}

/**
 * Calculates the discount based on the mode.
 *
 * In percentage mode: discount = subtotal × (discountRate / 100)
 * In amount mode: the discount is returned directly, but the rate is recalculated.
 *
 * @param subtotal - The subtotal amount
 * @param discountRate - The discount rate percentage (used in percentage mode)
 * @param discount - The fixed discount amount (used in amount mode)
 * @param mode - "percentage" or "amount"
 * @returns An object with the calculated discount and discountRate
 */
export function calculateDiscount(
  subtotal: number,
  discountRate: number,
  discount: number,
  mode: "percentage" | "amount",
): { discount: number; discountRate: number } {
  if (mode === "percentage") {
    const calculatedAmount =
      discountRate > 0 && subtotal > 0
        ? (subtotal * discountRate) / 100
        : discount;
    return { discount: calculatedAmount, discountRate };
  }

  // Amount mode: recalculate percentage from amount
  const calculatedRate =
    discount > 0 && subtotal > 0 ? (discount / subtotal) * 100 : discountRate;
  return { discount, discountRate: calculatedRate };
}

/**
 * Calculates the total: subtotal + taxAmount - discount
 *
 * @param subtotal - The subtotal amount
 * @param taxAmount - The calculated tax amount
 * @param discount - The calculated discount amount
 * @returns The final total
 */
export function calculateTotal(
  subtotal: number,
  taxAmount: number,
  discount: number,
): number {
  return subtotal + taxAmount - discount;
}

export interface FooterData {
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  taxMode: string;
  discountRate: string;
  discount: string;
  discountMode: string;
  total: string;
  [key: string]: unknown;
}

/**
 * Recalculates all footer totals (tax, discount, total) from items.
 * Used when the items array changes and the footer needs to be kept in sync.
 *
 * @param items - The current invoice/receipt items
 * @param footerData - The current footer section data
 * @returns A new footer data object with recalculated values
 */
export function recalculateFooterFromItems(
  items: InvoiceItem[],
  footerData: Record<string, unknown>,
): Record<string, unknown> {
  const subtotal = calculateSubtotal(items);
  const taxMode = (footerData.taxMode as string) || "percentage";
  const discountMode = (footerData.discountMode as string) || "percentage";

  const tax = calculateTax(
    subtotal,
    Number.parseFloat(String(footerData.taxRate || "0")),
    Number.parseFloat(String(footerData.taxAmount || "0")),
    taxMode as "percentage" | "amount",
  );

  const disc = calculateDiscount(
    subtotal,
    Number.parseFloat(String(footerData.discountRate || "0")),
    Number.parseFloat(String(footerData.discount || "0")),
    discountMode as "percentage" | "amount",
  );

  const total = calculateTotal(subtotal, tax.taxAmount, disc.discount);

  return {
    ...footerData,
    subtotal: subtotal.toFixed(2),
    taxAmount: tax.taxAmount.toFixed(2),
    taxRate: tax.taxRate.toFixed(2),
    discount: disc.discount.toFixed(2),
    discountRate: disc.discountRate.toFixed(2),
    total: total.toFixed(2),
  };
}

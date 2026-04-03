import type { CheckoutLineItem, CheckoutTotalsData } from "./checkout-sections";
import {
  normalizeCheckoutTotalsInput,
  parseLineItem,
  recalculateCheckoutTotals,
  withComputedLineTotals,
} from "./checkout-sections";
import type { TemplateSection } from "~/features/templates/shared/types";

export function getInvoiceLineItemsRawFromTemplateSections(
  sections: TemplateSection[],
): unknown[] {
  const invoiceItemsSection = sections.find((s) => s.type === "invoice-items");
  const items = invoiceItemsSection?.data?.items;
  return Array.isArray(items) ? items : [];
}

export function getInvoiceFooterRecordFromTemplateSections(
  sections: TemplateSection[],
): Record<string, unknown> {
  const footer = sections.find((s) => s.type === "invoice-footer");
  const data = footer?.data;
  return typeof data === "object" && data !== null && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
}

export function checkoutItemsAndTotalsFromInvoiceTemplateSections(
  sections: TemplateSection[],
): { items: CheckoutLineItem[]; totals: CheckoutTotalsData } {
  const raw = getInvoiceLineItemsRawFromTemplateSections(sections);
  const items = withComputedLineTotals(raw.map(parseLineItem));
  const footer = getInvoiceFooterRecordFromTemplateSections(sections);
  const base = normalizeCheckoutTotalsInput(footer);
  const totals = recalculateCheckoutTotals(items, base);
  return { items, totals };
}

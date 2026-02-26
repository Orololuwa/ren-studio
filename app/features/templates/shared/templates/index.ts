import { estimateTemplates } from "../../estimate/templates/estimate-templates";
import { invoiceTemplates } from "../../invoice/templates/invoice-templates";
import { orderConfirmationTemplates } from "../../order-confirmation/templates/order-confirmation-templates";
import { purchaseOrderTemplates } from "../../purchase-order/templates/purchase-order-templates";
import { quoteTemplates } from "../../quote/templates/quote-templates";
import { receiptTemplates } from "../../receipt/templates/receipt-templates";
import { resumeTemplates } from "../../resume/templates/resume-templates";
import { salesOrderTemplates } from "../../sales-order/templates/sales-order-templates";
import type { Template } from "../types";

export const predefinedTemplates: Record<string, Template[]> = {
  certificate: [],
  estimate: estimateTemplates,
  invoice: invoiceTemplates,
  "order-confirmation": orderConfirmationTemplates,
  "purchase-order": purchaseOrderTemplates,
  quote: quoteTemplates,
  receipt: receiptTemplates,
  "report-cards": [],
  resume: resumeTemplates,
  "sales-order": salesOrderTemplates,
};

// Helper to get template by ID
export function getTemplateById(id: string): Template | undefined {
  for (const templates of Object.values(predefinedTemplates)) {
    const found = templates.find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

// Helper to get templates by type
export function getTemplatesByType(type: string): Template[] {
  return predefinedTemplates[type] || [];
}

import { estimateComponentLibrary } from "../../estimate/components/component-library";
import { invoiceComponentLibrary } from "../../invoice/components/component-library";
import { purchaseOrderComponentLibrary } from "../../purchase-order/components/component-library";
import { quoteComponentLibrary } from "../../quote/components/component-library";
import { receiptComponentLibrary } from "../../receipt/components/component-library";
import { resumeComponentLibrary } from "../../resume/components/component-library";
import { salesOrderComponentLibrary } from "../../sales-order/components/component-library";
import type { ComponentDefinition } from "../types";

// Registry that combines all component libraries from different builder types
export const componentLibrary: Record<string, ComponentDefinition> = {
  ...resumeComponentLibrary,
  ...invoiceComponentLibrary,
  ...receiptComponentLibrary,
  ...quoteComponentLibrary,
  ...estimateComponentLibrary,
  ...purchaseOrderComponentLibrary,
  ...salesOrderComponentLibrary,
};

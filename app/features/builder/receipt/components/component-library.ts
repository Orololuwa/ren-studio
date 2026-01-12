import type { ComponentDefinition } from "../../shared/types";

export const receiptComponentLibrary: Record<string, ComponentDefinition> = {
  "receipt-header": {
    configurableProperties: [
      "storeLogo",
      "storeName",
      "storeAddress",
      "storeEmail",
      "storePhone",
      "receiptNumber",
      "receiptDate",
      "transactionId",
    ],
    defaultData: {
      storeLogo:
        "https://iwvduhvsxhjpxapdochp.supabase.co/storage/v1/object/public/app-images/organization-logos/logoipsum-404.svg",
      storeName: "",
      storeAddress: "",
      storeEmail: "",
      storePhone: "",
      receiptNumber: "",
      receiptDate: "",
      transactionId: "",
    },
    defaultStyles: {
      padding: "2rem",
    },
    icon: "FileText",
    label: "Receipt Header",
    type: "receipt-header",
  },
  "receipt-items": {
    configurableProperties: ["items"],
    defaultData: { items: [] },
    defaultStyles: {
      padding: "1rem",
    },
    icon: "List",
    label: "Receipt Items",
    type: "receipt-items",
  },
  "receipt-footer": {
    configurableProperties: [
      "subtotal",
      "taxAmount",
      "discount",
      "total",
      "paymentMethod",
      "transactionId",
      "thankYouMessage",
    ],
    defaultData: {
      subtotal: "",
      taxAmount: "",
      discount: "",
      total: "",
      paymentMethod: "",
      transactionId: "",
      thankYouMessage: "",
    },
    defaultStyles: {
      padding: "1rem",
    },
    icon: "FileText",
    label: "Receipt Footer",
    type: "receipt-footer",
  },
};

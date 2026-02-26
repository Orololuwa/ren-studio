import type { ComponentDefinition } from "../../shared/types";

export const deliveryNoteComponentLibrary: Record<string, ComponentDefinition> =
  {
    "delivery-note-header": {
      configurableProperties: [
        "companyLogo",
        "companyName",
        "companyAddress",
        "companyEmail",
        "companyPhone",
        "deliveryNoteNumber",
        "orderReference",
        "deliveryDate",
        "deliveredByName",
        "deliveredByCompany",
        "deliveredToName",
        "deliveredToAddress",
      ],
      defaultData: {
        companyLogo:
          "https://iwvduhvsxhjpxapdochp.supabase.co/storage/v1/object/public/app-images/organization-logos/logoipsum-404.svg",
        companyName: "",
        companyAddress: "",
        companyEmail: "",
        companyPhone: "",
        deliveryNoteNumber: "",
        orderReference: "",
        deliveryDate: "",
        deliveredByName: "",
        deliveredByCompany: "",
        deliveredToName: "",
        deliveredToAddress: "",
      },
      defaultStyles: {
        padding: "2rem",
      },
      icon: "FileText",
      label: "Delivery Note Header",
      type: "delivery-note-header",
    },
    "delivery-note-items": {
      configurableProperties: ["items"],
      defaultData: { items: [] },
      defaultStyles: {
        padding: "1rem",
      },
      icon: "List",
      label: "Delivery Note Items",
      type: "delivery-note-items",
    },
    "delivery-note-footer": {
      configurableProperties: [
        "receivedByName",
        "receivedByTitle",
        "receivedDate",
        "conditionReceived",
        "notes",
      ],
      defaultData: {
        receivedByName: "",
        receivedByTitle: "",
        receivedDate: "",
        conditionReceived: "",
        notes: "",
      },
      defaultStyles: {
        padding: "1rem",
      },
      icon: "FileText",
      label: "Delivery Note Footer",
      type: "delivery-note-footer",
    },
  };

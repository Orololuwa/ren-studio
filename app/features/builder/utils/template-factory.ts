import { getTemplateById } from "../templates";
import type { Template, TemplateType } from "../types";

export function createTemplateFromBase(
  baseTemplateId: string,
  organizationId: string,
  name: string,
): Template {
  const baseTemplate = getTemplateById(baseTemplateId);

  if (!baseTemplate) {
    throw new Error(`Base template not found: ${baseTemplateId}`);
  }

  // Clone and customize
  return {
    ...baseTemplate,
    createdAt: new Date(),
    id: crypto.randomUUID(),
    name,
    organizationId,
    // Deep clone sections with new IDs and reset data
    sections: baseTemplate.sections.map((section) => ({
      ...section,
      data: resetSectionData(section.type),
      id: crypto.randomUUID(),
    })),
    updatedAt: new Date(),
  };
}

export function createEmptyTemplate(
  type: TemplateType,
  organizationId: string,
  name: string,
): Template {
  return {
    createdAt: new Date(),
    globalStyles: {
      backgroundColor: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      textColor: "#000000",
    },
    id: crypto.randomUUID(),
    name,
    organizationId,
    sections: [],
    type,
    updatedAt: new Date(),
  };
}

function resetSectionData(type: string): Record<string, unknown> {
  switch (type) {
    case "header":
      return {
        contact: "",
        email: "",
        location: "",
        name: "",
        phone: "",
        socialLinks: [],
        title: "",
      };
    case "experience":
    case "education":
    case "certifications":
    case "projects":
    case "languages":
      return { entries: [] };
    case "skills":
      return { category: "", items: [] };
    case "summary":
      return { content: "" };
    case "invoice-header":
      return {
        companyLogo:
          "https://iwvduhvsxhjpxapdochp.supabase.co/storage/v1/object/public/app-images/organization-logos/logoipsum-404.svg",
        companyName: "",
        companyAddress: "",
        companyEmail: "",
        companyPhone: "",
        invoiceNumber: "",
        invoiceDate: "",
        dueDate: "",
        billToName: "",
        billToAddress: "",
        shipToName: "",
        shipToAddress: "",
      };
    case "invoice-items":
      return { items: [] };
    case "invoice-footer":
      return {
        subtotal: "",
        taxRate: "",
        taxAmount: "",
        discount: "",
        total: "",
        paymentTerms: "",
        notes: "",
      };
    default:
      return {};
  }
}

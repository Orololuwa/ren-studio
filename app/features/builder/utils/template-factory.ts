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
      return { email: "", location: "", name: "", phone: "", title: "" };
    case "experience":
    case "education":
      return { entries: [] };
    case "skills":
      return { category: "", items: [] };
    case "summary":
      return { content: "" };
    default:
      return {};
  }
}

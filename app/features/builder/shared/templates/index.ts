import { invoiceTemplates } from "../../invoice/templates/invoice-templates";
import { resumeTemplates } from "../../resume/templates/resume-templates";
import type { Template } from "../types";

// Add more template imports as you create them
// import { certificateTemplates } from "./certificate-templates";

export const predefinedTemplates: Record<string, Template[]> = {
  certificate: [],
  invoice: invoiceTemplates,
  "report-cards": [],
  resume: resumeTemplates,
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

import type { SectionType, TemplateType } from "../types";

/**
 * Normalizes a section type to remove template prefix if it already exists.
 * For example, "invoice-header" with template "invoice" becomes "header"
 * to avoid double-prefixing.
 */
function normalizeSectionType(
  templateType: TemplateType,
  sectionType: SectionType,
): string {
  const templatePrefix = `${templateType}-`;

  // If section type already starts with template prefix, remove it
  if (sectionType.startsWith(templatePrefix)) {
    return sectionType.replace(templatePrefix, "");
  }

  // Otherwise, return as-is (for resume sections like "header", "summary", etc.)
  return sectionType;
}

/**
 * Generates a predictable section ID based on template type and section type.
 * Format: {templateType}-{normalizedSectionType}
 *
 * Examples:
 * - Resume: "resume-header", "resume-summary", "resume-experience"
 * - Invoice: "invoice-header", "invoice-items", "invoice-footer"
 * - Receipt: "receipt-header", "receipt-items", "receipt-footer"
 *
 * @param templateType - The type of template (e.g., "resume", "invoice", "receipt")
 * @param sectionType - The type of section (e.g., "header", "invoice-header", "summary")
 * @returns A predictable section ID
 */
export function generateSectionId(
  templateType: TemplateType,
  sectionType: SectionType,
): string {
  const normalizedType = normalizeSectionType(templateType, sectionType);
  return `${templateType}-${normalizedType}`;
}

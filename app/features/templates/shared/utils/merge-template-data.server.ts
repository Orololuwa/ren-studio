import type { Template, TemplateSection } from "../types";

/**
 * Merges provided data values into template sections.
 * If a section ID exists in the provided data, it replaces the section's data.
 * If a section ID is not provided, the original template data is kept.
 *
 * @param template - The template containing sections with default/current data
 * @param data - Object keyed by section ID, containing data values to override
 * @returns Array of merged template sections
 */
export function mergeDataIntoTemplate(
  template: Template,
  data: Record<string, Record<string, unknown>>,
): TemplateSection[] {
  return template.sections.map((section) => {
    // If this section has provided data, merge it
    const providedData = data[section.id];
    if (providedData) {
      return {
        ...section,
        data: providedData,
      };
    }
    // Otherwise, keep the original section data
    return section;
  });
}

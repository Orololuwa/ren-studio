import { componentLibrary } from "~/features/builder/shared/components/component-library-registry";
import type {
  SectionType,
  TemplateType,
} from "~/features/builder/shared/types";
import { getComponentTypesForTemplateType } from "~/features/builder/shared/utils/generate-example-payload";
import { generateSectionId } from "~/features/builder/shared/utils/generate-section-id";

export interface FieldSchema {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  example?: unknown;
}

export interface SectionSchema {
  sectionId: string;
  sectionType: string;
  label: string;
  fields: FieldSchema[];
  structureExample: Record<string, unknown>;
}

export interface TemplateSchema {
  templateType: TemplateType;
  sections: SectionSchema[];
}

/**
 * Determines the TypeScript/JSON type of a value
 */
function inferType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "array";
    }
    const firstItem = value[0];
    if (typeof firstItem === "object" && firstItem !== null) {
      return "array<object>";
    }
    return `array<${typeof firstItem}>`;
  }
  if (typeof value === "object" && value !== null) {
    return "object";
  }
  return typeof value;
}

/**
 * Determines if a field is required based on its default value
 * Fields with empty strings, empty arrays, or null are considered optional
 */
function isRequired(_fieldName: string, defaultValue: unknown): boolean {
  // Array fields (entries/items) are always optional (can be empty)
  if (Array.isArray(defaultValue)) {
    return false;
  }
  // Empty strings are optional
  if (defaultValue === "") {
    return false;
  }
  // Null/undefined are optional
  if (defaultValue === null || defaultValue === undefined) {
    return false;
  }
  // Fields with actual default values might be required, but we'll be conservative
  // and mark them as optional unless they're clearly required
  return false;
}

/**
 * Gets the schema for a specific section
 */
function getSectionSchema(
  templateType: TemplateType,
  sectionType: string,
): SectionSchema | null {
  const component = componentLibrary[sectionType];
  if (!component) {
    return null;
  }

  const sectionId = generateSectionId(templateType, sectionType as SectionType);

  const fields: FieldSchema[] = Object.entries(component.defaultData).map(
    ([fieldName, defaultValue]) => {
      const type = inferType(defaultValue);
      const required = isRequired(fieldName, defaultValue);

      // Special handling for array fields
      let description: string | undefined;
      let example: unknown;

      if (fieldName === "entries" || fieldName === "items") {
        if (sectionType === "experience") {
          description = "Array of work experience entries";
          example = [
            {
              company: "string",
              position: "string",
              startDate: "string",
              endDate: "string",
              description: "string (HTML supported)",
            },
          ];
        } else if (sectionType === "education") {
          description = "Array of education entries";
          example = [
            {
              institution: "string",
              degree: "string",
              year: "string",
            },
          ];
        } else if (sectionType === "certifications") {
          description = "Array of certification entries";
          example = [
            {
              name: "string",
              issuer: "string",
              date: "string",
              link: "string (URL)",
            },
          ];
        } else if (sectionType === "projects") {
          description = "Array of project entries";
          example = [
            {
              name: "string",
              description: "string (HTML supported)",
              technologies: "array<string>",
              link: "string (URL)",
              date: "string",
            },
          ];
        } else if (sectionType === "languages") {
          description = "Array of language entries";
          example = [
            {
              language: "string",
              proficiency:
                "string (Beginner | Intermediate | Advanced | Fluent | Native)",
            },
          ];
        } else if (
          sectionType === "invoice-items" ||
          sectionType === "receipt-items"
        ) {
          description = "Array of item entries";
          example = [
            {
              description: "string",
              quantity: "string",
              unitPrice: "string",
              total: "string",
            },
          ];
        } else {
          description = "Array of entries";
        }
      } else if (fieldName === "socialLinks") {
        description = "Array of social media links";
        example = [
          {
            name: "string",
            link: "string (URL)",
          },
        ];
      } else if (fieldName === "technologies") {
        description = "Array of technology names";
        example = ["string"];
      } else if (fieldName.includes("content") || fieldName === "description") {
        description = "Rich text content (HTML supported)";
      } else if (fieldName.includes("date") || fieldName.includes("Date")) {
        description = "Date string (YYYY-MM-DD format)";
      } else if (fieldName.includes("email")) {
        description = "Email address";
      } else if (fieldName.includes("phone")) {
        description = "Phone number";
      } else if (fieldName.includes("website") || fieldName.includes("link")) {
        description = "URL";
      } else if (fieldName.includes("logo") || fieldName.includes("Logo")) {
        description = "Image URL";
      } else if (
        fieldName.includes("taxMode") ||
        fieldName.includes("discountMode")
      ) {
        description = "string (percentage | fixed)";
      } else if (fieldName.includes("Rate") || fieldName.includes("rate")) {
        description = "Numeric string (percentage or amount)";
      } else if (fieldName.includes("show")) {
        description = "boolean";
      }

      return {
        name: fieldName,
        type,
        required,
        description,
        example,
      };
    },
  );

  // Generate structure example for the entire section
  const structureExample: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.example !== undefined) {
      structureExample[field.name] = field.example;
    } else if (field.type === "string") {
      structureExample[field.name] = "string";
    } else if (field.type === "number") {
      structureExample[field.name] = 0;
    } else if (field.type === "boolean") {
      structureExample[field.name] = true;
    } else if (field.type === "array") {
      structureExample[field.name] = [];
    } else if (field.type === "array<string>") {
      structureExample[field.name] = ["string"];
    } else if (field.type === "array<object>") {
      structureExample[field.name] = [{}];
    } else {
      structureExample[field.name] = null;
    }
  }

  return {
    sectionId,
    sectionType,
    label: component.label,
    fields,
    structureExample,
  };
}

/**
 * Gets the complete schema for a template type
 */
export function getTemplateSchema(templateType: TemplateType): TemplateSchema {
  const componentTypes = getComponentTypesForTemplateType(templateType);
  const sections: SectionSchema[] = [];

  componentTypes.forEach((sectionType) => {
    const schema = getSectionSchema(templateType, sectionType);
    if (schema) {
      sections.push(schema);
    }
  });

  return {
    templateType,
    sections,
  };
}

/**
 * Gets schemas for all available template types
 */
export function getAllTemplateSchemas(): TemplateSchema[] {
  const templateTypes: TemplateType[] = ["resume", "invoice", "receipt"];
  return templateTypes.map((type) => getTemplateSchema(type));
}

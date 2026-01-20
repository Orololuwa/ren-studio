import { componentLibrary } from "../components/component-library-registry";
import type { TemplateType } from "../types";

/**
 * Generates example data for a field based on its name and type
 */
function generateExampleValue(
  fieldName: string,
  defaultValue: unknown,
): unknown {
  // If it's already an array, generate example array items
  if (Array.isArray(defaultValue)) {
    if (fieldName === "entries" || fieldName === "items") {
      // For entries/items arrays, return empty array (will be handled by section-specific logic)
      return [];
    }
    if (fieldName === "socialLinks") {
      return [
        { name: "LinkedIn", link: "https://linkedin.com/in/johndoe" },
        { name: "GitHub", link: "https://github.com/johndoe" },
      ];
    }
    if (fieldName === "technologies") {
      return ["React", "TypeScript", "Node.js"];
    }
    return [];
  }

  // Generate example values based on field name patterns
  const lowerName = fieldName.toLowerCase();

  if (lowerName.includes("email")) {
    return "john.doe@example.com";
  }
  if (lowerName.includes("phone")) {
    return "+1 (555) 123-4567";
  }
  if (lowerName.includes("name") && !lowerName.includes("company")) {
    if (lowerName.includes("billto") || lowerName.includes("shipto")) {
      return "Jane Smith";
    }
    return "John Doe";
  }
  if (lowerName.includes("company") || lowerName.includes("store")) {
    if (lowerName.includes("name")) {
      return "Acme Corporation";
    }
    if (lowerName.includes("address")) {
      return "123 Business St, Suite 100\nSan Francisco, CA 94105";
    }
  }
  if (lowerName.includes("address")) {
    return "123 Main St, Apt 4B\nSan Francisco, CA 94105";
  }
  if (lowerName.includes("location")) {
    return "San Francisco, CA";
  }
  if (lowerName.includes("title") || lowerName.includes("position")) {
    return "Senior Software Engineer";
  }
  if (lowerName.includes("website")) {
    return "https://example.com";
  }
  if (lowerName.includes("number") || lowerName.includes("id")) {
    if (lowerName.includes("invoice")) {
      return "INV-2024-001";
    }
    if (lowerName.includes("receipt")) {
      return "RCP-2024-001";
    }
    if (lowerName.includes("transaction")) {
      return "TXN-2024-001";
    }
    return "12345";
  }
  if (lowerName.includes("date")) {
    return "2024-01-15";
  }
  if (lowerName.includes("duedate")) {
    return "2024-02-15";
  }
  if (lowerName.includes("content") || lowerName.includes("description")) {
    if (lowerName.includes("summary")) {
      return "Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, TypeScript, and Node.js. Proven track record of delivering scalable web applications.";
    }
    return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  }
  if (lowerName.includes("category")) {
    return "Technical Skills";
  }
  if (lowerName.includes("subtotal") || lowerName.includes("total")) {
    return "1000.00";
  }
  if (lowerName.includes("tax") || lowerName.includes("discount")) {
    if (lowerName.includes("rate")) {
      return "10";
    }
    return "100.00";
  }
  if (lowerName.includes("quantity")) {
    return "2";
  }
  if (lowerName.includes("unitprice") || lowerName.includes("price")) {
    return "50.00";
  }
  if (lowerName.includes("payment") && lowerName.includes("method")) {
    return "Credit Card";
  }
  if (lowerName.includes("thank") || lowerName.includes("message")) {
    return "Thank you for your purchase!";
  }
  if (lowerName.includes("terms")) {
    return "Net 30";
  }
  if (lowerName.includes("notes")) {
    return "Please make payment within 30 days.";
  }

  // Default: return empty string or the default value
  return defaultValue ?? "";
}

/**
 * Generates example entries for array-based sections
 */
function generateExampleEntries(sectionType: string): unknown[] {
  switch (sectionType) {
    case "experience":
      return [
        {
          company: "Tech Corp",
          position: "Senior Software Engineer",
          startDate: "2020-01",
          endDate: "Present",
          description:
            "Led development of scalable web applications using React and Node.js. Mentored junior developers and improved code quality.",
        },
        {
          company: "Startup Inc",
          position: "Software Engineer",
          startDate: "2018-06",
          endDate: "2019-12",
          description:
            "Developed and maintained frontend applications. Collaborated with cross-functional teams to deliver features on time.",
        },
      ];
    case "education":
      return [
        {
          institution: "University of Technology",
          degree: "Bachelor of Science in Computer Science",
          year: "2018",
        },
        {
          institution: "Community College",
          degree: "Associate Degree in Software Development",
          year: "2016",
        },
      ];
    case "certifications":
      return [
        {
          name: "AWS Certified Solutions Architect",
          issuer: "Amazon Web Services",
          date: "2023-05",
          link: "https://aws.amazon.com/certification",
        },
        {
          name: "React Developer Certification",
          issuer: "Meta",
          date: "2022-11",
          link: "https://react.dev",
        },
      ];
    case "projects":
      return [
        {
          name: "E-Commerce Platform",
          description:
            "Built a full-stack e-commerce platform with React, Node.js, and PostgreSQL. Implemented payment processing and inventory management.",
          technologies: ["React", "Node.js", "PostgreSQL", "Stripe"],
          link: "https://github.com/johndoe/ecommerce",
          date: "2023-08",
        },
        {
          name: "Task Management App",
          description:
            "Developed a collaborative task management application with real-time updates using WebSockets.",
          technologies: ["React", "TypeScript", "Socket.io"],
          link: "https://github.com/johndoe/taskapp",
          date: "2023-03",
        },
      ];
    case "languages":
      return [
        { language: "English", proficiency: "Native" },
        { language: "Spanish", proficiency: "Fluent" },
        { language: "French", proficiency: "Intermediate" },
      ];
    case "invoice-items":
    case "receipt-items":
      return [
        {
          description: "Web Development Services",
          quantity: "10",
          unitPrice: "100.00",
          total: "1000.00",
        },
        {
          description: "Consulting Hours",
          quantity: "5",
          unitPrice: "150.00",
          total: "750.00",
        },
      ];
    default:
      return [];
  }
}

/**
 * Generates example data for a section based on its type and default data
 */
function generateSectionExampleData(
  sectionType: string,
  defaultData: Record<string, unknown>,
): Record<string, unknown> {
  const exampleData: Record<string, unknown> = {};

  for (const [fieldName, defaultValue] of Object.entries(defaultData)) {
    if (fieldName === "entries" || fieldName === "items") {
      // Generate example entries/items
      exampleData[fieldName] = generateExampleEntries(sectionType);
    } else {
      // Generate example value for the field
      exampleData[fieldName] = generateExampleValue(fieldName, defaultValue);
    }
  }

  return exampleData;
}

/**
 * Gets all component types for a given template type
 */
function getComponentTypesForTemplateType(
  templateType: TemplateType,
): string[] {
  switch (templateType) {
    case "resume":
      return [
        "header",
        "summary",
        "experience",
        "education",
        "skills",
        "projects",
        "certifications",
        "languages",
      ];
    case "invoice":
      return ["invoice-header", "invoice-items", "invoice-footer"];
    case "receipt":
      return ["receipt-header", "receipt-items", "receipt-footer"];
    default:
      return [];
  }
}

/**
 * Generates an example payload with all possible fields for a template type
 * @param templateType - The type of template (e.g., "resume", "invoice", "receipt")
 * @returns Example payload in the format { sections: { [sectionId]: { ...data } } }
 */
export function generateExamplePayload(
  templateType: TemplateType,
): Record<string, Record<string, unknown>> {
  const sections: Record<string, Record<string, unknown>> = {};
  const componentTypes = getComponentTypesForTemplateType(templateType);

  componentTypes.forEach((componentType, index) => {
    const component = componentLibrary[componentType];
    if (!component) {
      return;
    }

    // Generate section ID based on template type and section type
    let sectionId: string;
    if (templateType === "resume") {
      // Resume sections use format like "resume-header-1"
      sectionId = `resume-${componentType}-${index + 1}`;
    } else if (templateType === "invoice") {
      sectionId = `invoice-${componentType.replace("invoice-", "")}-${index + 1}`;
    } else if (templateType === "receipt") {
      sectionId = `receipt-${componentType.replace("receipt-", "")}-${index + 1}`;
    } else {
      sectionId = `${componentType}-${index + 1}`;
    }

    // Generate example data for this section
    const exampleData = generateSectionExampleData(
      componentType,
      component.defaultData,
    );

    sections[sectionId] = exampleData;
  });

  return sections;
}

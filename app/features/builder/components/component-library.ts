import type { ComponentDefinition } from "../types";

export const componentLibrary: Record<string, ComponentDefinition> = {
  education: {
    configurableProperties: ["entries"],
    defaultData: { entries: [] },
    defaultStyles: {
      marginTop: "1rem",
      padding: "1rem",
    },
    icon: "GraduationCap",
    label: "Education",
    type: "education",
  },
  experience: {
    configurableProperties: ["entries"],
    defaultData: { entries: [] },
    defaultStyles: {
      marginTop: "1rem",
      padding: "1rem",
    },
    icon: "Briefcase",
    label: "Work Experience",
    type: "experience",
  },
  header: {
    configurableProperties: [
      "name",
      "title",
      "contact",
      "email",
      "phone",
      "location",
    ],
    defaultData: {
      contact: "",
      email: "",
      location: "",
      name: "",
      phone: "",
      title: "",
    },
    defaultStyles: {
      backgroundColor: "#ffffff",
      padding: "2rem",
      textAlign: "center",
    },
    icon: "Heading",
    label: "Header",
    type: "header",
  },
  skills: {
    configurableProperties: ["items", "category"],
    defaultData: {
      category: "",
      items: [],
    },
    defaultStyles: {
      marginTop: "1rem",
      padding: "1rem",
    },
    icon: "Star",
    label: "Skills",
    type: "skills",
  },
  summary: {
    configurableProperties: ["content"],
    defaultData: {
      content: "",
    },
    defaultStyles: {
      marginTop: "1rem",
      padding: "1rem",
    },
    icon: "FileText",
    label: "Summary",
    type: "summary",
  },
};

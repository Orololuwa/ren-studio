import type { ComponentDefinition } from "../types";

export const componentLibrary: Record<string, ComponentDefinition> = {
  certifications: {
    configurableProperties: ["entries"],
    defaultData: { entries: [] },
    defaultStyles: {
      marginTop: "1rem",
      padding: "1rem",
    },
    icon: "Award",
    label: "Certifications",
    type: "certifications",
  },
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
      "socialLinks",
    ],
    defaultData: {
      contact: "",
      email: "",
      location: "",
      name: "",
      phone: "",
      socialLinks: [],
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
  languages: {
    configurableProperties: ["entries"],
    defaultData: { entries: [] },
    defaultStyles: {
      marginTop: "1rem",
      padding: "1rem",
    },
    icon: "Languages",
    label: "Languages",
    type: "languages",
  },
  projects: {
    configurableProperties: ["entries"],
    defaultData: { entries: [] },
    defaultStyles: {
      marginTop: "1rem",
      padding: "1rem",
    },
    icon: "FolderKanban",
    label: "Projects",
    type: "projects",
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

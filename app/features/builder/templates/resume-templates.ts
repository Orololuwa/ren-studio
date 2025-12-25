import type { Template } from "../types";

export const resumeTemplates: Template[] = [
  {
    createdAt: new Date(),
    globalStyles: {
      backgroundColor: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      textColor: "#000000",
    },
    id: "resume-modern-professional",
    name: "Modern Professional",
    organizationId: "", // Will be set when template is copied
    sections: [
      {
        data: {
          email: "john.doe@example.com",
          location: "San Francisco, CA",
          name: "John Doe",
          phone: "+1 (555) 123-4567",
          title: "Software Engineer",
        },
        id: "header-1",
        order: 0,
        styles: {
          backgroundColor: "#ffffff",
          borderBottom: "2px solid #667eea",
          padding: "2rem",
          paddingBottom: "1rem",
          textAlign: "center",
        },
        type: "header",
      },
      {
        data: {
          content:
            "Experienced software engineer with 5+ years of expertise in full-stack development, cloud architecture, and team leadership.",
        },
        id: "summary-1",
        order: 1,
        styles: {
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          marginTop: "1rem",
          padding: "1.5rem",
        },
        type: "summary",
      },
      {
        data: {
          entries: [
            {
              company: "Tech Corp",
              description:
                "Led development of microservices architecture serving 1M+ users. Mentored junior developers and improved code quality.",
              endDate: "Present",
              position: "Senior Software Engineer",
              startDate: "2020",
            },
            {
              company: "StartupXYZ",
              description:
                "Built and maintained React/Node.js applications. Implemented CI/CD pipelines reducing deployment time by 60%.",
              endDate: "2020",
              position: "Full Stack Developer",
              startDate: "2018",
            },
          ],
        },
        id: "experience-1",
        order: 2,
        styles: {
          marginTop: "1rem",
          padding: "1.5rem",
        },
        type: "experience",
      },
      {
        data: {
          entries: [
            {
              degree: "Bachelor of Science in Computer Science",
              institution: "University of Technology",
              year: "2018",
            },
          ],
        },
        id: "education-1",
        order: 3,
        styles: {
          marginTop: "1rem",
          padding: "1.5rem",
        },
        type: "education",
      },
      {
        data: {
          category: "Technical Skills",
          items: [
            "React",
            "TypeScript",
            "Node.js",
            "AWS",
            "Docker",
            "PostgreSQL",
          ],
        },
        id: "skills-1",
        order: 4,
        styles: {
          marginTop: "1rem",
          padding: "1.5rem",
        },
        type: "skills",
      },
    ],
    type: "resume",
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    globalStyles: {
      backgroundColor: "#ffffff",
      fontFamily: "Georgia, serif",
      fontSize: "12pt",
      textColor: "#000000",
    },
    id: "resume-classic-elegant",
    name: "Classic Elegant",
    organizationId: "", // Will be set when template is copied
    sections: [
      {
        data: {
          email: "jane.smith@example.com",
          name: "Jane Smith",
          phone: "+1 (555) 987-6543",
          title: "Product Manager",
        },
        id: "header-2",
        order: 0,
        styles: {
          backgroundColor: "#1a1a1a",
          color: "#ffffff",
          padding: "3rem 2rem",
          textAlign: "center",
        },
        type: "header",
      },
      {
        data: {
          entries: [
            {
              company: "Innovation Labs",
              description:
                "Drive product strategy and roadmap for B2B SaaS platform.",
              endDate: "Present",
              position: "Product Manager",
              startDate: "2019",
            },
          ],
        },
        id: "experience-2",
        order: 1,
        styles: {
          borderLeft: "4px solid #1a1a1a",
          marginTop: "2rem",
          padding: "2rem",
          paddingLeft: "1.5rem",
        },
        type: "experience",
      },
      {
        data: {
          entries: [
            {
              degree: "MBA",
              institution: "Business School",
              year: "2017",
            },
          ],
        },
        id: "education-2",
        order: 2,
        styles: {
          borderLeft: "4px solid #1a1a1a",
          marginTop: "1rem",
          padding: "2rem",
          paddingLeft: "1.5rem",
        },
        type: "education",
      },
    ],
    type: "resume",
    updatedAt: new Date(),
  },
];

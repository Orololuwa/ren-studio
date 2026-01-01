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
          color: "#000000",
          padding: "2rem",
          paddingBottom: "1rem",
          textAlign: "center",
        },
        type: "header",
      },
      {
        data: {
          content:
            "<p>Experienced software engineer with 5+ years of expertise in full-stack development, cloud architecture, and team leadership.</p>",
        },
        id: "summary-1",
        order: 1,
        styles: {
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
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
                "<ul><li>Led development of microservices architecture serving 1M+ users</li><li>Mentored junior developers and improved code quality</li><li>Optimized system performance and scalability</li></ul>",
              endDate: "Present",
              position: "Senior Software Engineer",
              startDate: "2020",
            },
            {
              company: "StartupXYZ",
              description:
                "<ul><li>Built and maintained React/Node.js applications</li><li>Implemented CI/CD pipelines reducing deployment time by 60%</li><li>Collaborated with cross-functional teams on product features</li></ul>",
              endDate: "2020",
              position: "Full Stack Developer",
              startDate: "2018",
            },
          ],
        },
        id: "experience-1",
        order: 2,
        styles: {
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
          content:
            "<p>Strategic product manager with expertise in B2B SaaS platforms, product strategy, and cross-functional collaboration.</p>",
        },
        id: "summary-2",
        order: 1,
        styles: {
          borderLeft: "4px solid #1a1a1a",
          padding: "2rem",
          paddingLeft: "1.5rem",
        },
        type: "summary",
      },
      {
        data: {
          entries: [
            {
              company: "Innovation Labs",
              description:
                "<ul><li>Drive product strategy and roadmap for B2B SaaS platform</li><li>Collaborate with engineering and design teams</li><li>Analyze market trends and user feedback</li></ul>",
              endDate: "Present",
              position: "Product Manager",
              startDate: "2019",
            },
          ],
        },
        id: "experience-2",
        order: 2,
        styles: {
          borderLeft: "4px solid #1a1a1a",
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
        order: 3,
        styles: {
          borderLeft: "4px solid #1a1a1a",
          padding: "2rem",
          paddingLeft: "1.5rem",
        },
        type: "education",
      },
      {
        data: {
          category: "Core Competencies",
          items: [
            "Product Strategy",
            "Roadmap Planning",
            "Stakeholder Management",
            "Agile Methodologies",
            "Data Analysis",
            "User Research",
          ],
        },
        id: "skills-2",
        order: 4,
        styles: {
          borderLeft: "4px solid #1a1a1a",
          padding: "2rem",
          paddingLeft: "1.5rem",
        },
        type: "skills",
      },
    ],
    type: "resume",
    updatedAt: new Date(),
  },
];

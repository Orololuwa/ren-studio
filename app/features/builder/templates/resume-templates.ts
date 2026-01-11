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
          socialLinks: [
            { link: "https://linkedin.com/in/johndoe", name: "LinkedIn" },
            { link: "https://github.com/johndoe", name: "GitHub" },
            { link: "https://johndoe.dev", name: "Portfolio" },
          ],
          title: "Software Engineer",
        },
        id: "header-1",
        order: 0,
        styles: {
          color: "#000000",
          marginLeft: "2rem",
          marginRight: "2rem",
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
          borderTop: "2px solid #000000",
          marginLeft: "2rem",
          marginRight: "2rem",
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
          borderTop: "2px solid #000000",
          marginLeft: "2rem",
          marginRight: "2rem",
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
          borderTop: "2px solid #000000",
          marginLeft: "2rem",
          marginRight: "2rem",
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
          borderTop: "2px solid #000000",
          marginLeft: "2rem",
          marginRight: "2rem",
          padding: "1.5rem",
        },
        type: "skills",
      },
      {
        data: {
          entries: [
            {
              date: "2023",
              description:
                "<p>Built a full-stack e-commerce platform with React and Node.js serving 10,000+ daily active users.</p><ul><li>Implemented payment processing with Stripe</li><li>Optimized database queries reducing load time by 40%</li><li>Deployed on AWS with CI/CD pipeline</li></ul>",
              link: "https://github.com/johndoe/ecommerce",
              name: "E-commerce Platform",
              technologies: ["React", "Node.js", "PostgreSQL", "AWS", "Stripe"],
            },
            {
              date: "2022",
              description:
                "<p>Developed a collaborative task management application with real-time updates.</p><ul><li>Used WebSockets for real-time collaboration</li><li>Implemented drag-and-drop interface</li><li>Built with TypeScript and React</li></ul>",
              link: "https://github.com/johndoe/taskapp",
              name: "Task Management App",
              technologies: ["React", "TypeScript", "WebSockets", "MongoDB"],
            },
          ],
        },
        id: "projects-1",
        order: 5,
        styles: {
          borderTop: "2px solid #000000",
          marginLeft: "2rem",
          marginRight: "2rem",
          padding: "1.5rem",
        },
        type: "projects",
      },
      {
        data: {
          entries: [
            {
              date: "2023",
              issuer: "Amazon Web Services",
              link: "https://www.credly.com/badges/example",
              name: "AWS Certified Solutions Architect",
            },
            {
              date: "2022",
              issuer: "Google Cloud",
              link: "https://www.credly.com/badges/google-cloud-professional-developer",
              name: "Google Cloud Professional Developer",
            },
          ],
        },
        id: "certifications-1",
        order: 6,
        styles: {
          borderTop: "2px solid #000000",
          marginLeft: "2rem",
          marginRight: "2rem",
          padding: "1.5rem",
        },
        type: "certifications",
      },
      {
        data: {
          entries: [
            { language: "English", proficiency: "Native" },
            { language: "Spanish", proficiency: "Fluent" },
            { language: "French", proficiency: "Intermediate" },
          ],
        },
        id: "languages-1",
        order: 7,
        styles: {
          borderTop: "2px solid #000000",
          marginLeft: "2rem",
          marginRight: "2rem",
          padding: "1.5rem",
        },
        type: "languages",
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
      fontSize: "14px",
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
          socialLinks: [
            { link: "https://linkedin.com/in/janesmith", name: "LinkedIn" },
            { link: "https://twitter.com/janesmith", name: "Twitter" },
          ],
          title: "Product Manager",
        },
        id: "header-2",
        order: 0,
        styles: {
          backgroundColor: "#1a1a1a",
          color: "#ffffff",
          padding: "2rem 1rem",
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
          paddingBottom: "0.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1rem",
          paddingTop: "1.5rem",
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
          paddingBottom: "0.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1rem",
          paddingTop: "1.5rem",
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
          paddingBottom: "0.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1rem",
          paddingTop: "1.5rem",
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
          paddingBottom: "0.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1rem",
          paddingTop: "1.5rem",
        },
        type: "skills",
      },
      {
        data: {
          entries: [
            {
              date: "2022",
              description:
                "<p>Led development of analytics dashboard for B2B SaaS platform.</p><ul><li>Increased user engagement by 35%</li><li>Reduced data load time by 50%</li><li>Collaborated with engineering and design teams</li></ul>",
              link: "https://example.com/analytics-dashboard",
              name: "SaaS Analytics Dashboard",
              technologies: ["React", "D3.js", "Python", "PostgreSQL"],
            },
          ],
        },
        id: "projects-2",
        order: 5,
        styles: {
          borderLeft: "4px solid #1a1a1a",
          paddingBottom: "0.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1rem",
          paddingTop: "1.5rem",
        },
        type: "projects",
      },
      {
        data: {
          entries: [
            {
              date: "2021",
              issuer: "Product Management Institute",
              link: "https://www.productmanagementinstitute.org/certifications",
              name: "Certified Product Manager",
            },
          ],
        },
        id: "certifications-2",
        order: 6,
        styles: {
          borderLeft: "4px solid #1a1a1a",
          paddingBottom: "0.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1rem",
          paddingTop: "1.5rem",
        },
        type: "certifications",
      },
      {
        data: {
          entries: [
            { language: "English", proficiency: "Native" },
            { language: "German", proficiency: "Advanced" },
          ],
        },
        id: "languages-2",
        order: 7,
        styles: {
          borderLeft: "4px solid #1a1a1a",
          paddingBottom: "0.5rem",
          paddingLeft: "1.5rem",
          paddingRight: "1rem",
          paddingTop: "1.5rem",
        },
        type: "languages",
      },
    ],
    type: "resume",
    updatedAt: new Date(),
  },
];

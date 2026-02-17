import { describe, expect, test } from "vitest";

import type { TemplateSection } from "../../shared/types";
import {
  generateResumeExportHTML,
  generateResumePreviewHTML,
} from "./html-generator-resume.server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createSection = (
  overrides: Partial<TemplateSection>,
): TemplateSection => ({
  id: "section-1",
  type: "header",
  order: 0,
  data: {},
  styles: {},
  ...overrides,
});

// ---------------------------------------------------------------------------
// renderResumeSectionToHTML (tested indirectly via generateResumePreviewHTML)
// ---------------------------------------------------------------------------

describe("Resume HTML Generation – Section Rendering", () => {
  describe("header section", () => {
    test("given: a header with name, title, contact fields, should: render them in the HTML", () => {
      const section = createSection({
        type: "header",
        data: {
          name: "John Doe",
          title: "Software Engineer",
          contact: "john@example.com",
          email: "john@example.com",
          phone: "+1-555-0100",
          location: "San Francisco, CA",
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("John Doe");
      expect(html).toContain("Software Engineer");
      expect(html).toContain("john@example.com");
      expect(html).toContain("+1-555-0100");
      expect(html).toContain("San Francisco, CA");
      expect(html).toContain("section-header");
    });

    test("given: a header with social links, should: render links with href and text", () => {
      const section = createSection({
        type: "header",
        data: {
          name: "Jane",
          socialLinks: [
            { name: "GitHub", link: "https://github.com/jane" },
            { name: "LinkedIn", link: "https://linkedin.com/in/jane" },
          ],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain('href="https://github.com/jane"');
      expect(html).toContain("GitHub");
      expect(html).toContain('href="https://linkedin.com/in/jane"');
      expect(html).toContain("LinkedIn");
      expect(html).toContain("social-links");
    });

    test("given: a header with no social links, should: not render social-links div", () => {
      const section = createSection({
        type: "header",
        data: { name: "Jane", socialLinks: [] },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).not.toContain('<div class="social-links">');
    });

    test("given: a header with empty name, should: render empty h1", () => {
      const section = createSection({
        type: "header",
        data: { name: "", title: "" },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("<h1></h1>");
    });
  });

  describe("summary section", () => {
    test("given: a summary with content, should: render rich text content", () => {
      const section = createSection({
        type: "summary",
        data: { content: "<p>Experienced engineer with 5+ years</p>" },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("section-summary");
      expect(html).toContain("Summary");
      expect(html).toContain("rich-text-content");
      expect(html).toContain("Experienced engineer with 5+ years");
    });

    test("given: a summary with &nbsp; in content, should: sanitize the content", () => {
      const section = createSection({
        type: "summary",
        data: { content: "self&nbsp;-taught developer" },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).not.toContain("&nbsp;-");
    });

    test("given: a summary with empty content, should: render empty rich-text-content", () => {
      const section = createSection({
        type: "summary",
        data: { content: "" },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("rich-text-content");
    });
  });

  describe("experience section", () => {
    test("given: experience entries, should: render company, position, dates, and description", () => {
      const section = createSection({
        type: "experience",
        data: {
          entries: [
            {
              company: "Tech Corp",
              position: "Senior Dev",
              startDate: "2020-01",
              endDate: "Present",
              description: "<p>Led a team of 5</p>",
            },
          ],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("section-experience");
      expect(html).toContain("Work Experience");
      expect(html).toContain("Tech Corp");
      expect(html).toContain("Senior Dev");
      expect(html).toContain("2020-01");
      expect(html).toContain("Present");
      expect(html).toContain("Led a team of 5");
    });

    test("given: empty entries array, should: render the section header only", () => {
      const section = createSection({
        type: "experience",
        data: { entries: [] },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("Work Experience");
      // The class name appears in CSS rules, so check that no actual entry div is rendered
      expect(html).not.toContain('<div class="experience-entry">');
    });

    test("given: entries is not an array, should: render without crashing", () => {
      const section = createSection({
        type: "experience",
        data: { entries: "invalid" },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("section-experience");
    });
  });

  describe("education section", () => {
    test("given: education entries, should: render institution, degree, and year", () => {
      const section = createSection({
        type: "education",
        data: {
          entries: [
            {
              institution: "MIT",
              degree: "BSc Computer Science",
              year: "2018",
            },
          ],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("section-education");
      expect(html).toContain("Education");
      expect(html).toContain("MIT");
      expect(html).toContain("BSc Computer Science");
      expect(html).toContain("2018");
    });
  });

  describe("skills section", () => {
    test("given: skills items and a category, should: render the category heading and skill items", () => {
      const section = createSection({
        type: "skills",
        data: {
          category: "Programming Languages",
          items: ["JavaScript", "TypeScript", "Python"],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("section-skills");
      expect(html).toContain("Programming Languages");
      expect(html).toContain("JavaScript");
      expect(html).toContain("TypeScript");
      expect(html).toContain("Python");
      expect(html).toContain("skill-item");
    });

    test("given: no category, should: default to 'Skills' heading", () => {
      const section = createSection({
        type: "skills",
        data: { items: ["React"] },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("Skills");
    });
  });

  describe("certifications section", () => {
    test("given: certification entries, should: render name, issuer, date, and link", () => {
      const section = createSection({
        type: "certifications",
        data: {
          entries: [
            {
              name: "AWS Certified",
              issuer: "Amazon",
              date: "2023-01",
              link: "https://aws.amazon.com/cert",
            },
          ],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("section-certifications");
      expect(html).toContain("Certifications");
      expect(html).toContain("AWS Certified");
      expect(html).toContain("Amazon");
      expect(html).toContain("2023-01");
      expect(html).toContain('href="https://aws.amazon.com/cert"');
      expect(html).toContain("View Certificate");
    });

    test("given: a certification without a link, should: not render View Certificate", () => {
      const section = createSection({
        type: "certifications",
        data: {
          entries: [{ name: "Cert", issuer: "Issuer", date: "2023", link: "" }],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).not.toContain("View Certificate");
    });
  });

  describe("projects section", () => {
    test("given: project entries, should: render name, date, link, technologies, and description", () => {
      const section = createSection({
        type: "projects",
        data: {
          entries: [
            {
              name: "E-Commerce App",
              date: "2023-08",
              link: "https://github.com/project",
              technologies: ["React", "Node.js"],
              description: "<p>Built a full-stack app</p>",
            },
          ],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("section-projects");
      expect(html).toContain("Projects");
      expect(html).toContain("E-Commerce App");
      expect(html).toContain("2023-08");
      expect(html).toContain('href="https://github.com/project"');
      expect(html).toContain("View Project");
      expect(html).toContain("tech-tag");
      expect(html).toContain("React");
      expect(html).toContain("Node.js");
      expect(html).toContain("Built a full-stack app");
    });

    test("given: a project without technologies, should: not render technologies div in the section content", () => {
      const section = createSection({
        type: "projects",
        data: {
          entries: [
            {
              name: "Project",
              date: "2023",
              link: "",
              technologies: [],
              description: "desc",
            },
          ],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      // The class name appears in CSS rules, so check there's no actual technologies div rendered
      expect(html).not.toContain('<div class="technologies">');
    });
  });

  describe("languages section", () => {
    test("given: language entries, should: render language and proficiency", () => {
      const section = createSection({
        type: "languages",
        data: {
          entries: [
            { language: "English", proficiency: "Native" },
            { language: "Spanish", proficiency: "Fluent" },
          ],
        },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain("section-languages");
      expect(html).toContain("Languages");
      expect(html).toContain("English");
      expect(html).toContain("Native");
      expect(html).toContain("Spanish");
      expect(html).toContain("Fluent");
    });
  });

  describe("unknown section type", () => {
    test("given: an unknown section type, should: render section data as JSON", () => {
      const section = createSection({
        type: "personal-info" as TemplateSection["type"],
        data: { foo: "bar" },
      });

      const html = generateResumePreviewHTML([section], {});

      expect(html).toContain('"foo":"bar"');
    });
  });
});

// ---------------------------------------------------------------------------
// generateResumeHTML – full document tests
// ---------------------------------------------------------------------------

describe("Resume HTML Generation – Full Document", () => {
  test("given: sections, should: generate valid HTML structure", () => {
    const sections = [
      createSection({ type: "header", order: 0, data: { name: "Test" } }),
    ];

    const html = generateResumePreviewHTML(sections, {});

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<head>");
    expect(html).toContain("</head>");
    expect(html).toContain("<body>");
    expect(html).toContain("</body>");
    expect(html).toContain("</html>");
    expect(html).toContain("template-container");
  });

  test("given: preview mode, should: set title to 'Resume Preview'", () => {
    const html = generateResumePreviewHTML(
      [createSection({ data: { name: "T" } })],
      {},
    );

    expect(html).toContain("<title>Resume Preview</title>");
  });

  test("given: export mode, should: set title to 'Resume Export'", () => {
    const html = generateResumeExportHTML(
      [createSection({ data: { name: "T" } })],
      {},
    );

    expect(html).toContain("<title>Resume Export</title>");
  });

  test("given: export mode, should: include @media print rules for page-break", () => {
    const html = generateResumeExportHTML(
      [createSection({ data: { name: "T" } })],
      {},
    );

    expect(html).toContain("page-break-inside: avoid");
    expect(html).toContain("orphans: 3");
    expect(html).toContain("widows: 3");
  });

  test("given: preview mode with max-width, should: use max-width for container", () => {
    const html = generateResumePreviewHTML(
      [createSection({ data: { name: "T" } })],
      {},
    );

    expect(html).toContain("max-width: 210mm");
  });

  test("given: export mode, should: use fixed width for container", () => {
    const html = generateResumeExportHTML(
      [createSection({ data: { name: "T" } })],
      {},
    );

    expect(html).toContain("width: 210mm");
  });

  test("given: sections with different orders, should: sort them by order", () => {
    const sections = [
      createSection({
        id: "exp",
        type: "experience",
        order: 2,
        data: { entries: [] },
      }),
      createSection({
        id: "header",
        type: "header",
        order: 0,
        data: { name: "John" },
      }),
      createSection({
        id: "summary",
        type: "summary",
        order: 1,
        data: { content: "Summary text" },
      }),
    ];

    const html = generateResumePreviewHTML(sections, {});

    const headerIdx = html.indexOf("section-header");
    const summaryIdx = html.indexOf("section-summary");
    const experienceIdx = html.indexOf("section-experience");

    expect(headerIdx).toBeLessThan(summaryIdx);
    expect(summaryIdx).toBeLessThan(experienceIdx);
  });

  test("given: global styles with backgroundColor, should: apply it to the template container", () => {
    const globalStyles = { backgroundColor: "#f0f0f0" };

    const html = generateResumePreviewHTML(
      [createSection({ data: { name: "T" } })],
      globalStyles,
    );

    expect(html).toContain("background: #f0f0f0");
  });

  test("given: global styles with border properties, should: apply borders to template-container", () => {
    const globalStyles = { borderLeft: "3px solid blue" };

    const html = generateResumePreviewHTML(
      [createSection({ data: { name: "T" } })],
      globalStyles,
    );

    expect(html).toContain("border-left: 3px solid blue");
  });

  describe("Color handling", () => {
    describe("color palette resolution", () => {
      test("given: section with color palette reference, should: resolve it to actual color", () => {
        const section = createSection({
          type: "header",
          data: { name: "T" },
          styles: { backgroundColor: "$colorPalette[0]" },
          usingGlobalPalette: true,
        });

        const html = generateResumePreviewHTML([section], {}, [
          "#ff0000",
          "#00ff00",
        ]);

        expect(html).toContain("background-color: #ff0000");
      });

      test("given: section with different palette index, should: resolve to correct color", () => {
        const section = createSection({
          type: "summary",
          data: { content: "Summary text" },
          styles: { color: "$colorPalette[1]" },
          usingGlobalPalette: true,
        });

        const html = generateResumePreviewHTML([section], {}, [
          "#ff0000",
          "#00ff00",
          "#0000ff",
        ]);

        expect(html).toContain('style="color: #00ff00');
      });

      test("given: section with section-specific palette, should: use section palette when usingGlobalPalette is false", () => {
        const globalPalette = ["#ff0000", "#00ff00"];
        const sectionPalette = ["#0000ff", "#ffff00"];
        const section = createSection({
          type: "header",
          data: { name: "John Doe" },
          styles: { color: "$colorPalette[0]" },
          usingGlobalPalette: false,
          colorPalette: sectionPalette,
        });

        const html = generateResumePreviewHTML([section], {}, globalPalette);

        expect(html).toContain('style="color: #0000ff');
      });

      test("given: multiple sections with different palette indices, should: resolve each correctly", () => {
        const colorPalette = ["#ff0000", "#00ff00", "#0000ff"];
        const sections = [
          createSection({
            type: "header",
            data: { name: "John" },
            styles: { color: "$colorPalette[0]" },
            usingGlobalPalette: true,
          }),
          createSection({
            type: "summary",
            data: { content: "Summary" },
            styles: { color: "$colorPalette[1]" },
            usingGlobalPalette: true,
          }),
          createSection({
            type: "experience",
            data: { entries: [] },
            styles: { color: "$colorPalette[2]" },
            usingGlobalPalette: true,
          }),
        ];

        const html = generateResumePreviewHTML(sections, {}, colorPalette);

        expect(html).toContain('style="color: #ff0000');
        expect(html).toContain('style="color: #00ff00');
        expect(html).toContain('style="color: #0000ff');
      });
    });

    describe("section-specific color application", () => {
      test("given: header section with color, should: apply to section element", () => {
        const section = createSection({
          type: "header",
          data: { name: "John Doe", title: "Developer" },
          styles: { color: "#333333" },
        });

        const html = generateResumePreviewHTML([section], {}, []);

        expect(html).toContain('class="section-header"');
        expect(html).toContain('style="color: #333333');
      });

      test("given: summary section with color, should: apply to section element", () => {
        const section = createSection({
          type: "summary",
          data: { content: "Experienced developer" },
          styles: { color: "#444444" },
        });

        const html = generateResumePreviewHTML([section], {}, []);

        expect(html).toContain('class="section-summary"');
        expect(html).toContain('style="color: #444444');
      });

      test("given: experience section with color, should: apply to section element", () => {
        const section = createSection({
          type: "experience",
          data: {
            entries: [
              {
                company: "Acme",
                position: "Developer",
                startDate: "2020",
                endDate: "2024",
                description: "Worked on projects",
              },
            ],
          },
          styles: { color: "#555555" },
        });

        const html = generateResumePreviewHTML([section], {}, []);

        expect(html).toContain('class="section-experience"');
        expect(html).toContain('style="color: #555555');
      });

      test("given: education section with color, should: apply to section element", () => {
        const section = createSection({
          type: "education",
          data: {
            entries: [
              {
                institution: "University",
                degree: "BS",
                field: "CS",
                startDate: "2016",
                endDate: "2020",
              },
            ],
          },
          styles: { color: "#666666" },
        });

        const html = generateResumePreviewHTML([section], {}, []);

        expect(html).toContain('class="section-education"');
        expect(html).toContain('style="color: #666666');
      });
    });
  });

  test("given: HTML special characters in data, should: escape them", () => {
    const section = createSection({
      type: "header",
      data: {
        name: 'O\'Reilly & "Partners"',
        title: "<script>alert(1)</script>",
      },
    });

    const html = generateResumePreviewHTML([section], {});

    expect(html).toContain("O&#039;Reilly &amp; &quot;Partners&quot;");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});

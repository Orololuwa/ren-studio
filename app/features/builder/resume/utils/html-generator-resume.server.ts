import type {
  CertificationEntry,
  LanguageEntry,
  ProjectEntry,
  SectionStyles,
  SocialLink,
  TemplateSection,
} from "../../shared/types";
import {
  getSectionColorPalette,
  resolveStyleColors,
} from "../../shared/utils/color-resolver";

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "'": "&#039;",
    '"': "&quot;",
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

function objectToCSS(
  styles: SectionStyles,
  colorPalette: string[] = [],
): string {
  // Resolve color references before converting to CSS
  const resolvedStyles = resolveStyleColors(
    styles as Record<string, string>,
    colorPalette,
  );
  return Object.entries(resolvedStyles)
    .filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => {
      const cssProperty = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssProperty}: ${value};`;
    })
    .join(" ");
}

function renderResumeSectionToHTML(
  section: TemplateSection,
  globalColorPalette: string[] = [],
): string {
  // Determine which palette to use for this section
  const sectionColorPalette = getSectionColorPalette(
    section.usingGlobalPalette,
    section.colorPalette,
    globalColorPalette,
  );
  const inlineStyles = objectToCSS(section.styles, sectionColorPalette);

  switch (section.type) {
    case "header": {
      const socialLinks = Array.isArray(section.data.socialLinks)
        ? (section.data.socialLinks as SocialLink[])
        : [];
      return `
        <section class="section-header" style="${inlineStyles}">
          <h1>${escapeHtml(String(section.data.name || ""))}</h1>
          <h2>${escapeHtml(String(section.data.title || ""))}</h2>
          <div class="contact-fields">
            ${section.data.contact ? `<span>${escapeHtml(String(section.data.contact))}</span>` : ""}
            ${section.data.email ? `<span>${escapeHtml(String(section.data.email))}</span>` : ""}
            ${section.data.phone ? `<span>${escapeHtml(String(section.data.phone))}</span>` : ""}
            ${section.data.location ? `<span>${escapeHtml(String(section.data.location))}</span>` : ""}
          </div>
          ${
            socialLinks.length > 0
              ? `
            <div class="social-links">
              ${socialLinks
                .map(
                  (link) =>
                    `<a href="${escapeHtml(link.link)}">${escapeHtml(link.name || link.link)}</a>`,
                )
                .join(" ")}
            </div>
          `
              : ""
          }
        </section>
      `;
    }

    case "summary": {
      return `
        <section class="section-summary" style="${inlineStyles}">
          <h2>Summary</h2>
          <div class="summary-entry">
            <div class="rich-text-content">${(section.data.content as string) || ""}</div>
          </div>
        </section>
      `;
    }

    case "experience": {
      const experiences = Array.isArray(section.data.entries)
        ? (section.data.entries as Array<{
            company: string;
            position: string;
            startDate: string;
            endDate: string;
            description: string;
          }>)
        : [];
      return `
        <section class="section-experience" style="${inlineStyles}">
          <h2>Work Experience</h2>
          ${experiences
            .map(
              (exp) => `
            <div class="experience-entry">
              <h3>${escapeHtml(exp.company || "")} - ${escapeHtml(exp.position || "")}</h3>
              <p class="date-range">${escapeHtml(exp.startDate || "")} - ${escapeHtml(exp.endDate || "")}</p>
              <div class="description">${exp.description || ""}</div>
            </div>
          `,
            )
            .join("")}
        </section>
      `;
    }

    case "education": {
      const educations = Array.isArray(section.data.entries)
        ? (section.data.entries as Array<{
            institution: string;
            degree: string;
            year: string;
          }>)
        : [];
      return `
        <section class="section-education" style="${inlineStyles}">
          <h2>Education</h2>
          ${educations
            .map(
              (edu) => `
            <div class="education-entry">
              <h3>${escapeHtml(edu.institution || "")}</h3>
              <p>${escapeHtml(edu.degree || "")} - ${escapeHtml(edu.year || "")}</p>
            </div>
          `,
            )
            .join("")}
        </section>
      `;
    }

    case "skills": {
      const skills = Array.isArray(section.data.items)
        ? (section.data.items as string[])
        : [];
      return `
        <section class="section-skills" style="${inlineStyles}">
          <h2>${escapeHtml(String(section.data.category || "Skills"))}</h2>
          <div class="skills-list">
            ${skills
              .map(
                (skill) => `
              <span class="skill-item">${escapeHtml(String(skill))}</span>
            `,
              )
              .join("")}
          </div>
        </section>
      `;
    }

    case "certifications": {
      const certifications = Array.isArray(section.data.entries)
        ? (section.data.entries as CertificationEntry[])
        : [];
      return `
        <section class="section-certifications" style="${inlineStyles}">
          <h2>Certifications</h2>
          ${certifications
            .map(
              (cert) => `
            <div class="certification-entry">
              <h3>${escapeHtml(cert.name || "")}</h3>
              <p>
                ${escapeHtml(cert.issuer || "")} - ${escapeHtml(cert.date || "")}
                ${cert.link ? ` - <a href="${escapeHtml(cert.link)}">View Certificate</a>` : ""}
              </p>
            </div>
          `,
            )
            .join("")}
        </section>
      `;
    }

    case "projects": {
      const projects = Array.isArray(section.data.entries)
        ? (section.data.entries as ProjectEntry[])
        : [];
      return `
        <section class="section-projects" style="${inlineStyles}">
          <h2>Projects</h2>
          ${projects
            .map(
              (project) => `
            <div class="project-entry">
              <h3>
                ${escapeHtml(project.name || "")}
                ${project.link ? ` - <a href="${escapeHtml(project.link)}">View Project</a>` : ""}
              </h3>
              <p class="date">${escapeHtml(project.date || "")}</p>
              ${
                Array.isArray(project.technologies) &&
                project.technologies.length > 0
                  ? `
                <div class="technologies">
                  ${project.technologies
                    .map(
                      (tech) =>
                        `<span class="tech-tag">${escapeHtml(tech)}</span>`,
                    )
                    .join("")}
                </div>
              `
                  : ""
              }
              <div class="description">${project.description || ""}</div>
            </div>
          `,
            )
            .join("")}
        </section>
      `;
    }

    case "languages": {
      const languages = Array.isArray(section.data.entries)
        ? (section.data.entries as LanguageEntry[])
        : [];
      return `
        <section class="section-languages" style="${inlineStyles}">
          <h2>Languages</h2>
          <div class="languages-list">
            ${languages
              .map(
                (lang) => `
              <div class="language-entry">
                <span class="language">${escapeHtml(lang.language || "")}</span>
                <span class="proficiency">${escapeHtml(lang.proficiency || "")}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>
      `;
    }

    default:
      return `
        <section class="section-${section.type}" style="${inlineStyles}">
          ${JSON.stringify(section.data)}
        </section>
      `;
  }
}

function generateResumeHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  isExport: boolean,
  colorPalette: string[] = [],
): string {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const globalCSS = objectToCSS(globalStyles as SectionStyles, colorPalette);
  const sectionsHTML = sortedSections
    .map((section) => renderResumeSectionToHTML(section, colorPalette))
    .join("\n");

  // Get background color from global styles (supports both 'backgroundColor' and 'background')
  const backgroundColor =
    globalStyles.backgroundColor || globalStyles.background || "#ffffff";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExport ? "Resume Export" : "Resume Preview"}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      ${globalCSS}
      line-height: 1.6;
    }
    
    .template-container {
      max-width: 210mm;
      margin: 0 auto;
      background: ${backgroundColor};
      padding: 0;
      min-height: 100vh;
    }
    
    .section-header h1 {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .section-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    
    .section-summary > h2,
    .section-experience > h2,
    .section-education > h2,
    .section-skills > h2,
    .section-certifications > h2,
    .section-projects > h2,
    .section-languages > h2 {
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .section-header .contact-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }
    
    .section-header .contact-fields span {
      display: inline-block;
    }
    
    .section-header .social-links {
      margin-top: 0.5rem;
    }
    
    .section-header a {
      color: inherit;
      text-decoration: underline;
    }
    
    .section-header .social-links a {
      margin-right: 1rem;
    }
    
    .experience-entry,
    .education-entry,
    .certification-entry,
    .project-entry,
    .summary-entry {
      margin-bottom: 1.5rem;
    }
    
    .section-summary > .summary-entry:last-child,
    .section-experience > .experience-entry:last-child,
    .section-education > .education-entry:last-child,
    .section-certifications > .certification-entry:last-child,
    .section-projects > .project-entry:last-child {
      margin-bottom: 0;
    }
    
    .experience-entry h3,
    .education-entry h3,
    .certification-entry h3,
    .project-entry h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .date-range,
    .date {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    
    .rich-text-content ul,
    .rich-text-content ol,
    .description ul,
    .description ol {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }
    
    .rich-text-content ul:last-child,
    .rich-text-content ol:last-child,
    .description ul:last-child,
    .description ol:last-child {
      margin-bottom: 0;
    }
    
    .rich-text-content ul,
    .description ul {
      list-style-type: disc;
    }
    
    .rich-text-content ol,
    .description ol {
      list-style-type: decimal;
    }
    
    .rich-text-content li,
    .description li {
      margin: 0.25rem 0;
    }
    
    .rich-text-content li:last-child,
    .description li:last-child {
      margin-bottom: 0;
    }
    
    .rich-text-content p {
      margin: 0.5rem 0;
    }
    
    .rich-text-content p:first-child {
      margin-top: 0;
    }
    
    .rich-text-content p:last-child {
      margin-bottom: 0;
    }
    
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .skill-item {
      padding: 0.25rem 0.5rem;
      background-color: #e5e7eb;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }
    
    .technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }
    
    .tech-tag {
      padding: 0.25rem 0.5rem;
      background-color: #e5e7eb;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }
    
    .languages-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .language-entry {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    .language {
      font-weight: 500;
    }
    
    .proficiency {
      color: #6b7280;
    }
    
    .section-certifications a,
    .section-projects a {
      color: inherit;
      text-decoration: underline;
      font-size: 0.875rem;
      font-weight: normal;
    }
    
    ${
      isExport
        ? `
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        orphans: 3;
        widows: 3;
      }
      
      /* Ensure borders are preserved and visible in print */
      .section-header,
      .section-summary,
      .section-experience,
      .section-education,
      .section-skills,
      .section-certifications,
      .section-projects,
      .section-languages {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      /* Preserve border styles (even though sections shouldn't break) */
      .section-header[style*="border"],
      .section-summary[style*="border"],
      .section-experience[style*="border"],
      .section-education[style*="border"],
      .section-skills[style*="border"],
      .section-certifications[style*="border"],
      .section-projects[style*="border"],
      .section-languages[style*="border"] {
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
      
      /* Prevent sections from breaking across pages */
      .section-header,
      .section-summary,
      .section-experience,
      .section-education,
      .section-skills,
      .section-certifications,
      .section-projects,
      .section-languages {
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-before: auto;
      }
      
      /* Prevent entries from breaking across pages */
      .experience-entry,
      .education-entry,
      .certification-entry,
      .project-entry,
      .summary-entry {
        page-break-inside: avoid;
        break-inside: avoid;
        orphans: 2;
        widows: 2;
      }
      
      /* Keep section headers with their content */
      .section-header {
        page-break-after: avoid;
      }
    }
    `
        : `
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .section-header {
        page-break-after: avoid;
      }
      .experience-entry,
      .education-entry,
      .certification-entry,
      .project-entry {
        page-break-inside: avoid;
      }
    }
    `
    }
  </style>
</head>
<body>
  <div class="template-container">
    ${sectionsHTML}
  </div>
</body>
</html>
  `.trim();
}

export function generateResumePreviewHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateResumeHTML(sections, globalStyles, false, colorPalette);
}

export function generateResumeExportHTML(
  sections: TemplateSection[],
  globalStyles: Record<string, string>,
  colorPalette: string[] = [],
): string {
  return generateResumeHTML(sections, globalStyles, true, colorPalette);
}

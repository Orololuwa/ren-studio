import { Fragment, useState } from "react";

import { formatCurrency } from "../../invoice/utils/currency-formatter";
import { useBuilderStore } from "../store/builder-store";
import type {
  CertificationEntry,
  InvoiceItem,
  LanguageEntry,
  ProjectEntry,
  SocialLink,
  TemplateSection,
} from "../types";
import { recalculateFooterFromItems } from "../utils/calculations";
import {
  getSectionColorPalette,
  resolveStyleColors,
} from "../utils/color-resolver";
import { InlineEditor } from "./inline-editor";

interface SectionRendererProps {
  section: TemplateSection;
  isSelected: boolean;
  onSelect: () => void;
}

interface ExperienceEntry {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  year: string;
}

export function SectionRenderer({
  section,
  isSelected,
  onSelect,
}: SectionRendererProps) {
  const { updateSection, currentTemplate } = useBuilderStore();
  const [editingField, setEditingField] = useState<{
    path: string[];
    value: string;
    label: string;
    isRichText: boolean;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get currency from template globalStyles, default to USD
  const currency = (currentTemplate?.globalStyles.currency as string) || "USD";

  const handleFieldClick = (
    e: React.MouseEvent,
    path: string[],
    value: string,
    label: string,
    isRichText: boolean,
  ) => {
    e.stopPropagation();
    setEditingField({ isRichText, label, path, value: String(value || "") });
    setIsModalOpen(true);
  };

  const handleSave = (newValue: string) => {
    if (!editingField) return;

    const { path } = editingField;
    const updatedData = { ...section.data };

    // Handle nested paths (e.g., ["entries", "0", "description"] or ["items", "0", "description"])
    if (path.length === 1 && path[0]) {
      const fieldName = path[0];
      updatedData[fieldName] = newValue;

      // Handle bidirectional sync for tax and discount when editing from canvas
      if (
        section.type === "invoice-footer" ||
        section.type === "receipt-footer"
      ) {
        const subtotal = Number.parseFloat(String(updatedData.subtotal || "0"));

        // Handle tax rate/amount sync
        if (fieldName === "taxRate") {
          const taxRate = Number.parseFloat(newValue || "0");
          const taxAmount = subtotal > 0 ? (subtotal * taxRate) / 100 : 0;
          updatedData.taxAmount = taxAmount.toFixed(2);
        } else if (fieldName === "taxAmount") {
          const taxAmount = Number.parseFloat(newValue || "0");
          const taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;
          updatedData.taxRate = taxRate.toFixed(2);
        }

        // Handle discount rate/amount sync
        if (fieldName === "discountRate") {
          const discountRate = Number.parseFloat(newValue || "0");
          const discount = subtotal > 0 ? (subtotal * discountRate) / 100 : 0;
          updatedData.discount = discount.toFixed(2);
        } else if (fieldName === "discount") {
          const discount = Number.parseFloat(newValue || "0");
          const discountRate = subtotal > 0 ? (discount / subtotal) * 100 : 0;
          updatedData.discountRate = discountRate.toFixed(2);
        }

        // Recalculate total
        const taxAmount = Number.parseFloat(
          String(updatedData.taxAmount || "0"),
        );
        const discount = Number.parseFloat(String(updatedData.discount || "0"));
        updatedData.total = (subtotal + taxAmount - discount).toFixed(2);
      }
    } else if (
      path.length === 3 &&
      (path[0] === "entries" || path[0] === "items") &&
      path[1] &&
      path[2]
    ) {
      // Handle entries array (experience, education) or items array (invoice-items)
      const index = Number.parseInt(path[1], 10);
      const field = path[2];
      const arrayName = path[0];
      const array = Array.isArray(updatedData[arrayName])
        ? [...(updatedData[arrayName] as unknown[])]
        : [];
      if (array[index]) {
        array[index] = {
          ...(array[index] as Record<string, unknown>),
          [field]: newValue,
        };

        // Auto-calculate item total if quantity or unitPrice changed
        if (
          arrayName === "items" &&
          (field === "quantity" || field === "unitPrice")
        ) {
          const item = array[index] as InvoiceItem;
          const qty = Number.parseFloat(item.quantity || "0");
          const price = Number.parseFloat(item.unitPrice || "0");
          item.total = (qty * price).toFixed(2);
        }

        updatedData[arrayName] = array;
      }
    }

    updateSection(section.id, { data: updatedData });

    // Recalculate subtotal and footer totals if items section was edited
    if (section.type === "invoice-items" || section.type === "receipt-items") {
      const items = Array.isArray(updatedData.items)
        ? (updatedData.items as InvoiceItem[])
        : [];

      const footerSection = currentTemplate?.sections.find(
        (s) => s.type === "invoice-footer" || s.type === "receipt-footer",
      );

      if (footerSection) {
        const updatedFooter = recalculateFooterFromItems(
          items,
          footerSection.data,
        );
        updateSection(footerSection.id, { data: updatedFooter });
      }
    }

    // Explicitly mark that we want to close
    setIsModalOpen(false);
    setEditingField(null);
  };

  const handleFieldKeyDown = (
    e: React.KeyboardEvent,
    path: string[],
    value: string,
    label: string,
    isRichText: boolean,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      handleFieldClick(
        e as unknown as React.MouseEvent,
        path,
        value,
        label,
        isRichText,
      );
    }
  };

  const renderSection = () => {
    // Determine which color palette to use for this section
    const globalColorPalette = currentTemplate?.colorPalette || [];
    const sectionColorPalette = getSectionColorPalette(
      section.usingGlobalPalette,
      section.colorPalette,
      globalColorPalette,
    );
    // Resolve color references in styles using the appropriate palette
    const resolvedStyles = resolveStyleColors(
      section.styles as Record<string, string>,
      sectionColorPalette,
    );
    const sectionStyles = resolvedStyles as React.CSSProperties;

    switch (section.type) {
      case "header": {
        const contact = section.data.contact
          ? String(section.data.contact)
          : null;
        const email = section.data.email ? String(section.data.email) : null;
        const phone = section.data.phone ? String(section.data.phone) : null;
        const location = section.data.location
          ? String(section.data.location)
          : null;
        return (
          <div style={sectionStyles}>
            <h1>
              <button
                className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-bold text-2xl"
                data-testid={`editable-field-${section.id}-name`}
                onClick={(e) =>
                  handleFieldClick(
                    e,
                    ["name"],
                    section.data.name as string,
                    "Name",
                    false,
                  )
                }
                onKeyDown={(e) =>
                  handleFieldKeyDown(
                    e,
                    ["name"],
                    section.data.name as string,
                    "Name",
                    false,
                  )
                }
                type="button"
              >
                {section.data.name as string}
              </button>
            </h1>
            <h2>
              <button
                className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-semibold text-xl"
                onClick={(e) =>
                  handleFieldClick(
                    e,
                    ["title"],
                    section.data.title as string,
                    "Title",
                    false,
                  )
                }
                onKeyDown={(e) =>
                  handleFieldKeyDown(
                    e,
                    ["title"],
                    section.data.title as string,
                    "Title",
                    false,
                  )
                }
                type="button"
              >
                {section.data.title as string}
              </button>
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {contact && (
                <button
                  aria-label="Edit contact information"
                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                  onClick={(e) =>
                    handleFieldClick(e, ["contact"], contact, "Contact", false)
                  }
                  onKeyDown={(e) =>
                    handleFieldKeyDown(
                      e,
                      ["contact"],
                      contact,
                      "Contact",
                      false,
                    )
                  }
                  type="button"
                >
                  {contact}
                </button>
              )}
              {email && (
                <button
                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                  onClick={(e) =>
                    handleFieldClick(e, ["email"], email, "Email", false)
                  }
                  onKeyDown={(e) =>
                    handleFieldKeyDown(e, ["email"], email, "Email", false)
                  }
                  type="button"
                >
                  {email}
                </button>
              )}
              {phone && (
                <button
                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                  onClick={(e) =>
                    handleFieldClick(e, ["phone"], phone, "Phone", false)
                  }
                  onKeyDown={(e) =>
                    handleFieldKeyDown(e, ["phone"], phone, "Phone", false)
                  }
                  type="button"
                >
                  {phone}
                </button>
              )}
              {location && (
                <button
                  className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                  onClick={(e) =>
                    handleFieldClick(
                      e,
                      ["location"],
                      location,
                      "Location",
                      false,
                    )
                  }
                  onKeyDown={(e) =>
                    handleFieldKeyDown(
                      e,
                      ["location"],
                      location,
                      "Location",
                      false,
                    )
                  }
                  type="button"
                >
                  {location}
                </button>
              )}
            </div>
            {Array.isArray(section.data.socialLinks) &&
              section.data.socialLinks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 justify-center">
                  {(section.data.socialLinks as SocialLink[]).map((link) => (
                    <a
                      className="underline hover:opacity-80"
                      href={link.link}
                      key={`social-${link.name}-${link.link}`}
                      onClick={(e) => e.stopPropagation()}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {link.name || link.link}
                    </a>
                  ))}
                </div>
              )}
          </div>
        );
      }

      case "experience": {
        const experiences = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as ExperienceEntry[];
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <h2 className="text-gray-900 text-xl font-bold">Work Experience</h2>
            {experiences.map((exp, idx) => (
              <div
                className="mb-4"
                key={`exp-${exp.company}-${exp.position}-${idx}`}
              >
                <h3 className="text-gray-900">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-semibold text-base"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "company"],
                        exp.company,
                        "Company",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "company"],
                        exp.company,
                        "Company",
                        false,
                      )
                    }
                    type="button"
                  >
                    {exp.company}
                  </button>{" "}
                  -{" "}
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-semibold"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "position"],
                        exp.position,
                        "Position",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "position"],
                        exp.position,
                        "Position",
                        false,
                      )
                    }
                    type="button"
                  >
                    {exp.position}
                  </button>
                </h3>
                <p className="text-sm text-gray-600">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "startDate"],
                        exp.startDate,
                        "Start Date",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "startDate"],
                        exp.startDate,
                        "Start Date",
                        false,
                      )
                    }
                    type="button"
                  >
                    {exp.startDate}
                  </button>{" "}
                  -{" "}
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "endDate"],
                        exp.endDate,
                        "End Date",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "endDate"],
                        exp.endDate,
                        "End Date",
                        false,
                      )
                    }
                    type="button"
                  >
                    {exp.endDate}
                  </button>
                </p>
                {/* biome-ignore lint/a11y/useSemanticElements: Rich text content div needs to be clickable but cannot be a button element */}
                <div
                  className="rich-text-content cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left block w-full"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: Rich text content from editor needs to be rendered as HTML
                  dangerouslySetInnerHTML={{
                    __html: exp.description || "",
                  }}
                  data-testid={`rich-text-content-${section.id}-description-${idx}`}
                  onClick={(e) =>
                    handleFieldClick(
                      e,
                      ["entries", String(idx), "description"],
                      exp.description,
                      "Description",
                      true,
                    )
                  }
                  onKeyDown={(e) =>
                    handleFieldKeyDown(
                      e,
                      ["entries", String(idx), "description"],
                      exp.description,
                      "Description",
                      true,
                    )
                  }
                  role="button"
                  tabIndex={0}
                />
              </div>
            ))}
          </div>
        );
      }

      case "education": {
        const educations = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as EducationEntry[];
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <h2 className="text-gray-900 text-xl font-bold">Education</h2>
            {educations.map((edu, idx) => (
              <div
                className="mb-4"
                key={`edu-${edu.institution}-${edu.degree}-${idx}`}
              >
                <h3 className="text-gray-900">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-semibold text-base"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "institution"],
                        edu.institution,
                        "Institution",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "institution"],
                        edu.institution,
                        "Institution",
                        false,
                      )
                    }
                    type="button"
                  >
                    {edu.institution}
                  </button>
                </h3>
                <p className="text-gray-900">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "degree"],
                        edu.degree,
                        "Degree",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "degree"],
                        edu.degree,
                        "Degree",
                        false,
                      )
                    }
                    type="button"
                  >
                    {edu.degree}
                  </button>{" "}
                  -{" "}
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "year"],
                        edu.year,
                        "Year",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "year"],
                        edu.year,
                        "Year",
                        false,
                      )
                    }
                    type="button"
                  >
                    {edu.year}
                  </button>
                </p>
              </div>
            ))}
          </div>
        );
      }

      case "skills": {
        const skills = Array.isArray(section.data.items)
          ? section.data.items
          : [];
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <h2 className="text-gray-900 text-xl font-bold">
              {(section.data.category as string) || "Skills"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  className="px-2 py-1 bg-gray-200 rounded text-gray-800"
                  key={`skill-${skill}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );
      }

      case "summary":
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <h2 className="text-gray-900 text-xl font-bold">Summary</h2>
            {/* biome-ignore lint/a11y/useSemanticElements: Rich text content div needs to be clickable but cannot be a button element */}
            <div
              className="rich-text-content cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left block w-full"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Rich text content from editor needs to be rendered as HTML
              dangerouslySetInnerHTML={{
                __html: (section.data.content as string) || "",
              }}
              data-testid={`rich-text-content-${section.id}-summary`}
              onClick={(e) =>
                handleFieldClick(
                  e,
                  ["content"],
                  section.data.content as string,
                  "Summary",
                  true,
                )
              }
              onKeyDown={(e) =>
                handleFieldKeyDown(
                  e,
                  ["content"],
                  section.data.content as string,
                  "Summary",
                  true,
                )
              }
              role="button"
              tabIndex={0}
            />
          </div>
        );

      case "certifications": {
        const certifications = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as CertificationEntry[];
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <h2 className="text-gray-900 text-xl font-bold">Certifications</h2>
            {certifications.map((cert, idx) => (
              <div className="mb-4" key={`cert-${cert.name}-${idx}`}>
                <h3 className="text-gray-900">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-semibold text-base"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "name"],
                        cert.name,
                        "Certification Name",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "name"],
                        cert.name,
                        "Certification Name",
                        false,
                      )
                    }
                    type="button"
                  >
                    {cert.name}
                  </button>
                </h3>
                <p className="text-gray-900">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "issuer"],
                        cert.issuer,
                        "Issuer",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "issuer"],
                        cert.issuer,
                        "Issuer",
                        false,
                      )
                    }
                    type="button"
                  >
                    {cert.issuer}
                  </button>{" "}
                  -{" "}
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "date"],
                        cert.date,
                        "Date",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "date"],
                        cert.date,
                        "Date",
                        false,
                      )
                    }
                    type="button"
                  >
                    {cert.date}
                  </button>
                  {cert.link && (
                    <>
                      {" - "}
                      <a
                        className="underline hover:opacity-80"
                        href={cert.link}
                        onClick={(e) => e.stopPropagation()}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        View Certificate
                      </a>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        );
      }

      case "projects": {
        const projects = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as ProjectEntry[];
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <h2 className="text-gray-900 text-xl font-bold">Projects</h2>
            {projects.map((project, idx) => (
              <div className="mb-4" key={`project-${project.name}-${idx}`}>
                <h3 className="text-gray-900">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-semibold text-base"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "name"],
                        project.name,
                        "Project Name",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "name"],
                        project.name,
                        "Project Name",
                        false,
                      )
                    }
                    type="button"
                  >
                    {project.name}
                  </button>
                  {project.link && (
                    <>
                      {" - "}
                      <a
                        className="underline hover:opacity-80"
                        href={project.link}
                        onClick={(e) => e.stopPropagation()}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        View Project
                      </a>
                    </>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "date"],
                        project.date,
                        "Date",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "date"],
                        project.date,
                        "Date",
                        false,
                      )
                    }
                    type="button"
                  >
                    {project.date}
                  </button>
                </p>
                {/* biome-ignore lint/a11y/useSemanticElements: Rich text content div needs to be clickable but cannot be a button element */}
                <div
                  className="rich-text-content cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left block w-full"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: Rich text content from editor needs to be rendered as HTML
                  dangerouslySetInnerHTML={{
                    __html: project.description || "",
                  }}
                  data-testid={`rich-text-content-${section.id}-description-${idx}`}
                  onClick={(e) =>
                    handleFieldClick(
                      e,
                      ["entries", String(idx), "description"],
                      project.description,
                      "Description",
                      true,
                    )
                  }
                  onKeyDown={(e) =>
                    handleFieldKeyDown(
                      e,
                      ["entries", String(idx), "description"],
                      project.description,
                      "Description",
                      true,
                    )
                  }
                  role="button"
                  tabIndex={0}
                />
                {Array.isArray(project.technologies) &&
                  project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 my-2">
                      {project.technologies.map((tech) => (
                        <span
                          className="px-2 py-1 bg-gray-200 rounded text-gray-800 text-sm"
                          key={`tech-${tech}`}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        );
      }

      case "languages": {
        const languages = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as LanguageEntry[];
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <h2 className="text-gray-900 text-xl font-bold">Languages</h2>
            <div className="space-y-2">
              {languages.map((lang, idx) => (
                <div
                  className="flex items-center gap-2"
                  key={`lang-${lang.language}-${lang.proficiency}-${idx}`}
                >
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-medium"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["entries", String(idx), "language"],
                        lang.language,
                        "Language",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["entries", String(idx), "language"],
                        lang.language,
                        "Language",
                        false,
                      )
                    }
                    type="button"
                  >
                    {lang.language}
                  </button>
                  <span className="text-gray-600">-</span>
                  <span className="text-gray-600">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "invoice-header": {
        const logoUrl = (section.data.companyLogo as string) || "";
        // Check if section has a color style to determine if we should use white text
        const hasColorStyle = sectionStyles.color;
        const textColorClass = hasColorStyle ? "" : "text-gray-900";
        const secondaryTextColorClass = hasColorStyle ? "" : "text-gray-600";
        return (
          <div style={sectionStyles}>
            <div className="flex justify-between mb-6">
              <div>
                {logoUrl && (
                  <div className="mb-4">
                    <button
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["companyLogo"],
                          logoUrl,
                          "Company Logo URL",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["companyLogo"],
                          logoUrl,
                          "Company Logo URL",
                          false,
                        )
                      }
                      type="button"
                    >
                      <img
                        alt="Company Logo"
                        className="h-12 object-contain"
                        src={logoUrl}
                      />
                    </button>
                  </div>
                )}
                <h2 className={`${textColorClass} text-xl font-bold mb-2`}>
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["companyName"],
                        section.data.companyName as string,
                        "Company Name",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["companyName"],
                        section.data.companyName as string,
                        "Company Name",
                        false,
                      )
                    }
                    type="button"
                  >
                    {(section.data.companyName as string) || "Company Name"}
                  </button>
                </h2>
                <div className={`text-sm ${secondaryTextColorClass}`}>
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["companyAddress"],
                        section.data.companyAddress as string,
                        "Company Address",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["companyAddress"],
                        section.data.companyAddress as string,
                        "Company Address",
                        false,
                      )
                    }
                    type="button"
                  >
                    {(section.data.companyAddress as string) ||
                      "Company Address"}
                  </button>
                  {(section.data.companyEmail as string | undefined) && (
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["companyEmail"],
                          section.data.companyEmail as string,
                          "Company Email",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["companyEmail"],
                          section.data.companyEmail as string,
                          "Company Email",
                          false,
                        )
                      }
                      type="button"
                    >
                      {section.data.companyEmail as string}
                    </button>
                  )}
                  {(section.data.companyPhone as string | undefined) && (
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["companyPhone"],
                          section.data.companyPhone as string,
                          "Company Phone",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["companyPhone"],
                          section.data.companyPhone as string,
                          "Company Phone",
                          false,
                        )
                      }
                      type="button"
                    >
                      {section.data.companyPhone as string}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h1 className={`${textColorClass} text-2xl font-bold mb-4`}>
                  INVOICE
                </h1>
                <div className="text-sm space-y-1">
                  <div>
                    <span className={secondaryTextColorClass}>Invoice #: </span>
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["invoiceNumber"],
                          section.data.invoiceNumber as string,
                          "Invoice Number",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["invoiceNumber"],
                          section.data.invoiceNumber as string,
                          "Invoice Number",
                          false,
                        )
                      }
                      type="button"
                    >
                      {(section.data.invoiceNumber as string) || "INV-001"}
                    </button>
                  </div>
                  <div>
                    <span className={secondaryTextColorClass}>Date: </span>
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["invoiceDate"],
                          section.data.invoiceDate as string,
                          "Invoice Date",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["invoiceDate"],
                          section.data.invoiceDate as string,
                          "Invoice Date",
                          false,
                        )
                      }
                      type="button"
                    >
                      {(section.data.invoiceDate as string) || "Date"}
                    </button>
                  </div>
                  {(section.data.dueDate as string | undefined) && (
                    <div>
                      <span className={secondaryTextColorClass}>
                        Due Date:{" "}
                      </span>
                      <button
                        className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                        onClick={(e) =>
                          handleFieldClick(
                            e,
                            ["dueDate"],
                            section.data.dueDate as string,
                            "Due Date",
                            false,
                          )
                        }
                        onKeyDown={(e) =>
                          handleFieldKeyDown(
                            e,
                            ["dueDate"],
                            section.data.dueDate as string,
                            "Due Date",
                            false,
                          )
                        }
                        type="button"
                      >
                        {section.data.dueDate as string}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <div className="text-sm">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left block w-full"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["billToName"],
                        section.data.billToName as string,
                        "Bill To Name",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["billToName"],
                        section.data.billToName as string,
                        "Bill To Name",
                        false,
                      )
                    }
                    type="button"
                  >
                    {(section.data.billToName as string) || "Client Name"}
                  </button>
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left block w-full"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["billToAddress"],
                        section.data.billToAddress as string,
                        "Bill To Address",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["billToAddress"],
                        section.data.billToAddress as string,
                        "Bill To Address",
                        false,
                      )
                    }
                    type="button"
                  >
                    {(section.data.billToAddress as string) || "Client Address"}
                  </button>
                </div>
              </div>
              {(section.data.shipToName as string | undefined) && (
                <div>
                  <h3 className="font-semibold mb-2">Ship To:</h3>
                  <div className="text-sm">
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left block w-full"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["shipToName"],
                          section.data.shipToName as string,
                          "Ship To Name",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["shipToName"],
                          section.data.shipToName as string,
                          "Ship To Name",
                          false,
                        )
                      }
                      type="button"
                    >
                      {section.data.shipToName as string}
                    </button>
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left block w-full"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["shipToAddress"],
                          section.data.shipToAddress as string,
                          "Ship To Address",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["shipToAddress"],
                          section.data.shipToAddress as string,
                          "Ship To Address",
                          false,
                        )
                      }
                      type="button"
                    >
                      {section.data.shipToAddress as string}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      case "invoice-items": {
        const items = Array.isArray(section.data.items)
          ? (section.data.items as InvoiceItem[])
          : [];
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-2 font-semibold">Description</th>
                  <th className="text-right p-2 font-semibold">Quantity</th>
                  <th className="text-right p-2 font-semibold">Unit Price</th>
                  <th className="text-right p-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={4}>
                      No items added. Click to add items in the properties
                      panel.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      className="border-b border-gray-200"
                      key={`item-${item.description}-${item.quantity}-${item.unitPrice}-${idx}`}
                    >
                      <td className="p-2">
                        <button
                          className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left w-full"
                          onClick={(e) =>
                            handleFieldClick(
                              e,
                              ["items", String(idx), "description"],
                              item.description,
                              "Description",
                              false,
                            )
                          }
                          onKeyDown={(e) =>
                            handleFieldKeyDown(
                              e,
                              ["items", String(idx), "description"],
                              item.description,
                              "Description",
                              false,
                            )
                          }
                          type="button"
                        >
                          {item.description || "Item Description"}
                        </button>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-right"
                          onClick={(e) =>
                            handleFieldClick(
                              e,
                              ["items", String(idx), "quantity"],
                              item.quantity,
                              "Quantity",
                              false,
                            )
                          }
                          onKeyDown={(e) =>
                            handleFieldKeyDown(
                              e,
                              ["items", String(idx), "quantity"],
                              item.quantity,
                              "Quantity",
                              false,
                            )
                          }
                          type="button"
                        >
                          {item.quantity || "0"}
                        </button>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-right"
                          onClick={(e) =>
                            handleFieldClick(
                              e,
                              ["items", String(idx), "unitPrice"],
                              item.unitPrice,
                              "Unit Price",
                              false,
                            )
                          }
                          onKeyDown={(e) =>
                            handleFieldKeyDown(
                              e,
                              ["items", String(idx), "unitPrice"],
                              item.unitPrice,
                              "Unit Price",
                              false,
                            )
                          }
                          type="button"
                        >
                          {formatCurrency(item.unitPrice, "en-US", currency)}
                        </button>
                      </td>
                      <td className="p-2 text-right font-semibold">
                        {formatCurrency(item.total, "en-US", currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case "invoice-footer": {
        const taxMode = (section.data.taxMode as string) || "percentage";
        const discountMode =
          (section.data.discountMode as string) || "percentage";
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-right">
                    {formatCurrency(
                      section.data.subtotal as
                        | string
                        | number
                        | null
                        | undefined,
                      "en-US",
                      currency,
                    )}
                  </span>
                </div>
                {(section.data.taxAmount as string | number | undefined) &&
                  Number(section.data.taxAmount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {section.data.showTaxRate !== false &&
                        section.data.taxRate &&
                        Number(section.data.taxRate) > 0 ? (
                          <Fragment>
                            Tax (
                            {taxMode === "percentage" ? (
                              <button
                                className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5"
                                onClick={(e) =>
                                  handleFieldClick(
                                    e,
                                    ["taxRate"],
                                    section.data.taxRate as string,
                                    "Tax Rate",
                                    false,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleFieldKeyDown(
                                    e,
                                    ["taxRate"],
                                    section.data.taxRate as string,
                                    "Tax Rate",
                                    false,
                                  )
                                }
                                type="button"
                              >
                                {String(section.data.taxRate || "")}%
                              </button>
                            ) : (
                              <span>{String(section.data.taxRate || "")}%</span>
                            )}
                            ):
                          </Fragment>
                        ) : (
                          "Tax:"
                        )}
                      </span>
                      <span>
                        {taxMode === "amount" ? (
                          <button
                            className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-right"
                            onClick={(e) =>
                              handleFieldClick(
                                e,
                                ["taxAmount"],
                                section.data.taxAmount as string,
                                "Tax Amount",
                                false,
                              )
                            }
                            onKeyDown={(e) =>
                              handleFieldKeyDown(
                                e,
                                ["taxAmount"],
                                section.data.taxAmount as string,
                                "Tax Amount",
                                false,
                              )
                            }
                            type="button"
                          >
                            {formatCurrency(
                              section.data.taxAmount as
                                | string
                                | number
                                | null
                                | undefined,
                              "en-US",
                              currency,
                            )}
                          </button>
                        ) : (
                          <span>
                            {formatCurrency(
                              section.data.taxAmount as
                                | string
                                | number
                                | null
                                | undefined,
                              "en-US",
                              currency,
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                {(section.data.discount as string | number | undefined) &&
                  Number(section.data.discount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {section.data.showDiscountRate !== false &&
                        section.data.discountRate &&
                        Number(section.data.discountRate) > 0 ? (
                          <Fragment>
                            Discount (
                            {discountMode === "percentage" ? (
                              <button
                                className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5"
                                onClick={(e) =>
                                  handleFieldClick(
                                    e,
                                    ["discountRate"],
                                    section.data.discountRate as string,
                                    "Discount Rate",
                                    false,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleFieldKeyDown(
                                    e,
                                    ["discountRate"],
                                    section.data.discountRate as string,
                                    "Discount Rate",
                                    false,
                                  )
                                }
                                type="button"
                              >
                                {String(section.data.discountRate || "")}%
                              </button>
                            ) : (
                              <span>
                                {String(section.data.discountRate || "")}%
                              </span>
                            )}
                            ):
                          </Fragment>
                        ) : (
                          "Discount:"
                        )}
                      </span>
                      <span>
                        {discountMode === "amount" ? (
                          <button
                            className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-right"
                            onClick={(e) =>
                              handleFieldClick(
                                e,
                                ["discount"],
                                section.data.discount as string,
                                "Discount",
                                false,
                              )
                            }
                            onKeyDown={(e) =>
                              handleFieldKeyDown(
                                e,
                                ["discount"],
                                section.data.discount as string,
                                "Discount",
                                false,
                              )
                            }
                            type="button"
                          >
                            -
                            {formatCurrency(
                              section.data.discount as
                                | string
                                | number
                                | null
                                | undefined,
                              "en-US",
                              currency,
                            )}
                          </button>
                        ) : (
                          <span>
                            -
                            {formatCurrency(
                              section.data.discount as
                                | string
                                | number
                                | null
                                | undefined,
                              "en-US",
                              currency,
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between border-t-2 border-gray-300 pt-2 font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-right">
                    {formatCurrency(
                      section.data.total as string | number | null | undefined,
                      "en-US",
                      currency,
                    )}
                  </span>
                </div>
              </div>
            </div>
            {(section.data.paymentTerms as string | undefined) && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Payment Terms: </span>
                </p>
                {/* biome-ignore lint/a11y/useSemanticElements: Rich text content div needs to be clickable but cannot be a button element */}
                <div
                  className="rich-text-content text-sm text-gray-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left block w-full"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: Rich text content from editor needs to be rendered as HTML
                  dangerouslySetInnerHTML={{
                    __html: (section.data.paymentTerms as string) || "",
                  }}
                  data-testid={`rich-text-content-${section.id}-paymentTerms`}
                  onClick={(e) =>
                    handleFieldClick(
                      e,
                      ["paymentTerms"],
                      section.data.paymentTerms as string,
                      "Payment Terms",
                      true,
                    )
                  }
                  onKeyDown={(e) =>
                    handleFieldKeyDown(
                      e,
                      ["paymentTerms"],
                      section.data.paymentTerms as string,
                      "Payment Terms",
                      true,
                    )
                  }
                  role="button"
                  tabIndex={0}
                />
              </div>
            )}
            {(section.data.notes as string | undefined) && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left w-full"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["notes"],
                        section.data.notes as string,
                        "Notes",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["notes"],
                        section.data.notes as string,
                        "Notes",
                        false,
                      )
                    }
                    type="button"
                  >
                    {section.data.notes as string}
                  </button>
                </p>
              </div>
            )}
          </div>
        );
      }

      case "receipt-header": {
        const logoUrl = (section.data.storeLogo as string) || "";
        // Check if section has a color style to determine if we should use white text
        const hasColorStyle = sectionStyles.color;
        const textColorClass = hasColorStyle ? "" : "text-gray-900";
        const secondaryTextColorClass = hasColorStyle ? "" : "text-gray-600";
        return (
          <div style={sectionStyles}>
            <div className="flex justify-between mb-6">
              <div>
                {logoUrl && (
                  <div className="mb-4">
                    <button
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["storeLogo"],
                          logoUrl,
                          "Store Logo URL",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["storeLogo"],
                          logoUrl,
                          "Store Logo URL",
                          false,
                        )
                      }
                      type="button"
                    >
                      <img
                        alt="Store Logo"
                        className="h-12 object-contain"
                        src={logoUrl}
                      />
                    </button>
                  </div>
                )}
                <h2 className={`${textColorClass} text-xl font-bold mb-2`}>
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["storeName"],
                        section.data.storeName as string,
                        "Store Name",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["storeName"],
                        section.data.storeName as string,
                        "Store Name",
                        false,
                      )
                    }
                    type="button"
                  >
                    {(section.data.storeName as string) || "Store Name"}
                  </button>
                </h2>
                <div className={`text-sm ${secondaryTextColorClass}`}>
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["storeAddress"],
                        section.data.storeAddress as string,
                        "Store Address",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["storeAddress"],
                        section.data.storeAddress as string,
                        "Store Address",
                        false,
                      )
                    }
                    type="button"
                  >
                    {(section.data.storeAddress as string) || "Store Address"}
                  </button>
                  {(section.data.storeEmail as string | undefined) && (
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["storeEmail"],
                          section.data.storeEmail as string,
                          "Store Email",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["storeEmail"],
                          section.data.storeEmail as string,
                          "Store Email",
                          false,
                        )
                      }
                      type="button"
                    >
                      {section.data.storeEmail as string}
                    </button>
                  )}
                  {(section.data.storePhone as string | undefined) && (
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["storePhone"],
                          section.data.storePhone as string,
                          "Store Phone",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["storePhone"],
                          section.data.storePhone as string,
                          "Store Phone",
                          false,
                        )
                      }
                      type="button"
                    >
                      {section.data.storePhone as string}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h1 className={`${textColorClass} text-2xl font-bold mb-4`}>
                  RECEIPT
                </h1>
                <div className="text-sm space-y-1">
                  <div>
                    <span className={secondaryTextColorClass}>Receipt #: </span>
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["receiptNumber"],
                          section.data.receiptNumber as string,
                          "Receipt Number",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["receiptNumber"],
                          section.data.receiptNumber as string,
                          "Receipt Number",
                          false,
                        )
                      }
                      type="button"
                    >
                      {(section.data.receiptNumber as string) || "RCP-001"}
                    </button>
                  </div>
                  <div>
                    <span className={secondaryTextColorClass}>Date: </span>
                    <button
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                      onClick={(e) =>
                        handleFieldClick(
                          e,
                          ["receiptDate"],
                          section.data.receiptDate as string,
                          "Receipt Date",
                          false,
                        )
                      }
                      onKeyDown={(e) =>
                        handleFieldKeyDown(
                          e,
                          ["receiptDate"],
                          section.data.receiptDate as string,
                          "Receipt Date",
                          false,
                        )
                      }
                      type="button"
                    >
                      {(section.data.receiptDate as string) || "Date"}
                    </button>
                  </div>
                  {(section.data.transactionId as string | undefined) && (
                    <div>
                      <span className={secondaryTextColorClass}>
                        Transaction ID:{" "}
                      </span>
                      <button
                        className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
                        onClick={(e) =>
                          handleFieldClick(
                            e,
                            ["transactionId"],
                            section.data.transactionId as string,
                            "Transaction ID",
                            false,
                          )
                        }
                        onKeyDown={(e) =>
                          handleFieldKeyDown(
                            e,
                            ["transactionId"],
                            section.data.transactionId as string,
                            "Transaction ID",
                            false,
                          )
                        }
                        type="button"
                      >
                        {section.data.transactionId as string}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "receipt-items": {
        const items = Array.isArray(section.data.items)
          ? (section.data.items as InvoiceItem[])
          : [];
        const hasColorStyle = sectionStyles.color;
        const textColorClass = hasColorStyle ? "" : "text-gray-900";
        return (
          <div className={textColorClass} style={sectionStyles}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-2 font-semibold">Description</th>
                  <th className="text-right p-2 font-semibold">Quantity</th>
                  <th className="text-right p-2 font-semibold">Unit Price</th>
                  <th className="text-right p-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={4}>
                      No items added. Click to add items in the properties
                      panel.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      className="border-b border-gray-200"
                      key={`item-${item.description}-${item.quantity}-${item.unitPrice}-${idx}`}
                    >
                      <td className="p-2">
                        <button
                          className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left w-full"
                          onClick={(e) =>
                            handleFieldClick(
                              e,
                              ["items", String(idx), "description"],
                              item.description,
                              "Description",
                              false,
                            )
                          }
                          onKeyDown={(e) =>
                            handleFieldKeyDown(
                              e,
                              ["items", String(idx), "description"],
                              item.description,
                              "Description",
                              false,
                            )
                          }
                          type="button"
                        >
                          {item.description || "Item Description"}
                        </button>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-right"
                          onClick={(e) =>
                            handleFieldClick(
                              e,
                              ["items", String(idx), "quantity"],
                              item.quantity,
                              "Quantity",
                              false,
                            )
                          }
                          onKeyDown={(e) =>
                            handleFieldKeyDown(
                              e,
                              ["items", String(idx), "quantity"],
                              item.quantity,
                              "Quantity",
                              false,
                            )
                          }
                          type="button"
                        >
                          {item.quantity || "0"}
                        </button>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-right"
                          onClick={(e) =>
                            handleFieldClick(
                              e,
                              ["items", String(idx), "unitPrice"],
                              item.unitPrice,
                              "Unit Price",
                              false,
                            )
                          }
                          onKeyDown={(e) =>
                            handleFieldKeyDown(
                              e,
                              ["items", String(idx), "unitPrice"],
                              item.unitPrice,
                              "Unit Price",
                              false,
                            )
                          }
                          type="button"
                        >
                          {formatCurrency(item.unitPrice, "en-US", currency)}
                        </button>
                      </td>
                      <td className="p-2 text-right font-semibold">
                        {formatCurrency(item.total, "en-US", currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case "receipt-footer": {
        const hasColorStyle = sectionStyles.color;
        const textColorClass = hasColorStyle ? "" : "text-gray-900";
        const taxMode = (section.data.taxMode as string) || "percentage";
        const discountMode =
          (section.data.discountMode as string) || "percentage";
        return (
          <div className={textColorClass} style={sectionStyles}>
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-right">
                    {formatCurrency(
                      section.data.subtotal as
                        | string
                        | number
                        | null
                        | undefined,
                      "en-US",
                      currency,
                    )}
                  </span>
                </div>
                {(section.data.taxAmount as string | number | undefined) &&
                  Number(section.data.taxAmount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {section.data.showTaxRate !== false &&
                        section.data.taxRate &&
                        Number(section.data.taxRate) > 0 ? (
                          <Fragment>
                            Tax (
                            {taxMode === "percentage" ? (
                              <button
                                className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5"
                                onClick={(e) =>
                                  handleFieldClick(
                                    e,
                                    ["taxRate"],
                                    section.data.taxRate as string,
                                    "Tax Rate",
                                    false,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleFieldKeyDown(
                                    e,
                                    ["taxRate"],
                                    section.data.taxRate as string,
                                    "Tax Rate",
                                    false,
                                  )
                                }
                                type="button"
                              >
                                {String(section.data.taxRate || "")}%
                              </button>
                            ) : (
                              <span>{String(section.data.taxRate || "")}%</span>
                            )}
                            ):
                          </Fragment>
                        ) : (
                          "Tax:"
                        )}
                      </span>
                      <span>
                        {taxMode === "amount" ? (
                          <button
                            className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-right"
                            onClick={(e) =>
                              handleFieldClick(
                                e,
                                ["taxAmount"],
                                section.data.taxAmount as string,
                                "Tax Amount",
                                false,
                              )
                            }
                            onKeyDown={(e) =>
                              handleFieldKeyDown(
                                e,
                                ["taxAmount"],
                                section.data.taxAmount as string,
                                "Tax Amount",
                                false,
                              )
                            }
                            type="button"
                          >
                            {formatCurrency(
                              section.data.taxAmount as
                                | string
                                | number
                                | null
                                | undefined,
                              "en-US",
                              currency,
                            )}
                          </button>
                        ) : (
                          <span>
                            {formatCurrency(
                              section.data.taxAmount as
                                | string
                                | number
                                | null
                                | undefined,
                              "en-US",
                              currency,
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                {(section.data.discount as string | number | undefined) &&
                  Number(section.data.discount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {section.data.showDiscountRate !== false &&
                        section.data.discountRate &&
                        Number(section.data.discountRate) > 0 ? (
                          <Fragment>
                            Discount (
                            {discountMode === "percentage" ? (
                              <button
                                className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5"
                                onClick={(e) =>
                                  handleFieldClick(
                                    e,
                                    ["discountRate"],
                                    section.data.discountRate as string,
                                    "Discount Rate",
                                    false,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleFieldKeyDown(
                                    e,
                                    ["discountRate"],
                                    section.data.discountRate as string,
                                    "Discount Rate",
                                    false,
                                  )
                                }
                                type="button"
                              >
                                {String(section.data.discountRate || "")}%
                              </button>
                            ) : (
                              <span>
                                {String(section.data.discountRate || "")}%
                              </span>
                            )}
                            ):
                          </Fragment>
                        ) : (
                          "Discount:"
                        )}
                      </span>
                      <span>
                        {discountMode === "amount" ? (
                          <button
                            className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-right"
                            onClick={(e) =>
                              handleFieldClick(
                                e,
                                ["discount"],
                                section.data.discount as string,
                                "Discount",
                                false,
                              )
                            }
                            onKeyDown={(e) =>
                              handleFieldKeyDown(
                                e,
                                ["discount"],
                                section.data.discount as string,
                                "Discount",
                                false,
                              )
                            }
                            type="button"
                          >
                            -
                            {formatCurrency(
                              section.data.discount as
                                | string
                                | number
                                | null
                                | undefined,
                              "en-US",
                              currency,
                            )}
                          </button>
                        ) : (
                          <span>
                            -
                            {formatCurrency(
                              section.data.discount as
                                | string
                                | number
                                | null
                                | undefined,
                              "en-US",
                              currency,
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between border-t-2 border-gray-300 pt-2 font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-right">
                    {formatCurrency(
                      section.data.total as string | number | null | undefined,
                      "en-US",
                      currency,
                    )}
                  </span>
                </div>
              </div>
            </div>
            {(section.data.paymentMethod as string | undefined) && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Payment Method: </span>
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["paymentMethod"],
                        section.data.paymentMethod as string,
                        "Payment Method",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["paymentMethod"],
                        section.data.paymentMethod as string,
                        "Payment Method",
                        false,
                      )
                    }
                    type="button"
                  >
                    {section.data.paymentMethod as string}
                  </button>
                </p>
              </div>
            )}
            {(section.data.transactionId as string | undefined) && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Transaction ID: </span>
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["transactionId"],
                        section.data.transactionId as string,
                        "Transaction ID",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["transactionId"],
                        section.data.transactionId as string,
                        "Transaction ID",
                        false,
                      )
                    }
                    type="button"
                  >
                    {section.data.transactionId as string}
                  </button>
                </p>
              </div>
            )}
            {(section.data.thankYouMessage as string | undefined) && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left w-full"
                    onClick={(e) =>
                      handleFieldClick(
                        e,
                        ["thankYouMessage"],
                        section.data.thankYouMessage as string,
                        "Thank You Message",
                        false,
                      )
                    }
                    onKeyDown={(e) =>
                      handleFieldKeyDown(
                        e,
                        ["thankYouMessage"],
                        section.data.thankYouMessage as string,
                        "Thank You Message",
                        false,
                      )
                    }
                    type="button"
                  >
                    {section.data.thankYouMessage as string}
                  </button>
                </p>
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="text-gray-900" style={sectionStyles}>
            {JSON.stringify(section.data)}
          </div>
        );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  const handleSectionClick = (e: React.MouseEvent) => {
    // Don't select section if modal is open
    if (editingField) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onSelect();
  };

  return (
    <>
      <style>{`
        /* Rich text content styling for lists and block elements */
        .rich-text-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: auto;
        }
        .rich-text-content * {
          max-width: 100%;
          box-sizing: border-box;
        }
        .rich-text-content ul,
        .rich-text-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          list-style-position: outside;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        .rich-text-content ul {
          list-style-type: disc;
        }
        .rich-text-content ol {
          list-style-type: decimal;
        }
        .rich-text-content li {
          margin: 0.25rem 0;
          display: list-item;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        .rich-text-content p {
          margin: 0.5rem 0;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        .rich-text-content p:first-child {
          margin-top: 0;
        }
        .rich-text-content p:last-child {
          margin-bottom: 0;
        }
        .rich-text-content strong,
        .rich-text-content b {
          font-weight: 600;
        }
        .rich-text-content em,
        .rich-text-content i {
          font-style: italic;
        }
        .rich-text-content u {
          text-decoration: underline;
        }
        .rich-text-content h1,
        .rich-text-content h2,
        .rich-text-content h3,
        .rich-text-content h4,
        .rich-text-content h5,
        .rich-text-content h6 {
          font-weight: 600;
          margin: 0.75rem 0 0.5rem 0;
        }
        .rich-text-content h1:first-child,
        .rich-text-content h2:first-child,
        .rich-text-content h3:first-child,
        .rich-text-content h4:first-child,
        .rich-text-content h5:first-child,
        .rich-text-content h6:first-child {
          margin-top: 0;
        }
        .rich-text-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin: 0.5rem 0;
          font-style: italic;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        .rich-text-content img {
          max-width: 100%;
          height: auto;
        }
        .rich-text-content pre {
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .rich-text-content code {
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
      `}</style>
      <section
        aria-label={`${section.type} section content`}
        className={`relative ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
        onClick={handleSectionClick}
        onKeyDown={handleKeyDown}
      >
        {renderSection()}
      </section>
      {editingField && (
        <InlineEditor
          fieldPath={editingField.path}
          isRichText={editingField.isRichText}
          label={editingField.label}
          onOpenChange={(open) => {
            // Only close if explicitly requested (via Save/Cancel buttons)
            // The InlineEditor component handles preventing accidental closes,
            // but we add an extra layer of protection here
            if (!open) {
              setIsModalOpen(false);
              setEditingField(null);
            } else {
              setIsModalOpen(open);
            }
          }}
          onSave={handleSave}
          open={isModalOpen}
          value={editingField.value}
        />
      )}
    </>
  );
}

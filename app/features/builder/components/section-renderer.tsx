import { useState } from "react";

import { useBuilderStore } from "../store/builder-store";
import type { TemplateSection } from "../types";
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
  const { updateSection } = useBuilderStore();
  const [editingField, setEditingField] = useState<{
    path: string[];
    value: string;
    label: string;
    isRichText: boolean;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    // Handle nested paths (e.g., ["entries", "0", "description"])
    if (path.length === 1 && path[0]) {
      updatedData[path[0]] = newValue;
    } else if (
      path.length === 3 &&
      path[0] === "entries" &&
      path[1] &&
      path[2]
    ) {
      // Handle entries array (experience, education)
      const index = Number.parseInt(path[1], 10);
      const field = path[2];
      const entries = Array.isArray(updatedData.entries)
        ? [...updatedData.entries]
        : [];
      if (entries[index]) {
        entries[index] = { ...entries[index], [field]: newValue };
        updatedData.entries = entries;
      }
    }

    updateSection(section.id, { data: updatedData });
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
    const sectionStyles = section.styles as React.CSSProperties;

    switch (section.type) {
      case "header": {
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
            <button
              className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left"
              onClick={(e) =>
                handleFieldClick(
                  e,
                  ["contact"],
                  section.data.contact as string,
                  "Contact",
                  false,
                )
              }
              onKeyDown={(e) =>
                handleFieldKeyDown(
                  e,
                  ["contact"],
                  section.data.contact as string,
                  "Contact",
                  false,
                )
              }
              type="button"
            >
              {String(section.data.contact ?? "")}
            </button>
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
                  handleFieldClick(e, ["location"], location, "Location", false)
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
        );
      }

      case "experience": {
        const experiences = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as ExperienceEntry[];
        return (
          <div className="text-gray-900" style={sectionStyles}>
            <h2 className="text-gray-900">Work Experience</h2>
            {experiences.map((exp, idx) => (
              <div
                className="mb-4"
                key={`exp-${exp.company}-${exp.position}-${idx}`}
              >
                <h3 className="text-gray-900">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-semibold"
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
            <h2 className="text-gray-900">Education</h2>
            {educations.map((edu, idx) => (
              <div
                className="mb-4"
                key={`edu-${edu.institution}-${edu.degree}-${idx}`}
              >
                <h3 className="text-gray-900">
                  <button
                    className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 text-left font-semibold"
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
            <h2 className="text-gray-900">
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
            <h2 className="text-gray-900">Summary</h2>
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

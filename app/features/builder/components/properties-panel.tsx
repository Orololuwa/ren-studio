import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useBuilderStore } from "../store/builder-store";
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ProjectEntry,
  SocialLink,
} from "../types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Inline Rich Text Editor Component
type ReactQuillProps = {
  value: string;
  onChange: (
    value: string,
    delta?: unknown,
    source?: unknown,
    editor?: unknown,
  ) => void;
  theme: string;
  style?: React.CSSProperties;
  modules?: {
    toolbar: (
      | string[]
      | {
          list: string;
        }[]
      | {
          link: boolean;
        }[]
    )[];
  };
};

const quillOptions: ReactQuillProps["modules"] = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ link: true }],
  ],
};

function RichTextEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [ReactQuill, setReactQuill] =
    useState<React.ComponentType<ReactQuillProps> | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      Promise.all([
        import("react-quill-new"),
        import("react-quill-new/dist/quill.snow.css"),
      ]).then(([quillModule]) => {
        const Quill =
          quillModule.default as unknown as React.ComponentType<ReactQuillProps>;
        setReactQuill(() => Quill);
      });
    }
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-[200px] p-4 border rounded bg-muted animate-pulse">
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="border rounded-md overflow-hidden bg-background">
        {ReactQuill ? (
          <>
            <ReactQuill
              modules={quillOptions}
              onChange={onChange}
              style={{ minHeight: "200px" }}
              theme="snow"
              value={value}
            />
            <style>{`
              /* Light mode - use default snow theme colors */
              .ql-container,
              .ql-toolbar,
              .ql-editor {
                pointer-events: auto !important;
              }

              /* Dark mode - apply dark theme */
              .dark .ql-snow {
                background-color: #1f2937 !important;
                border-color: #374151 !important;
              }
              .dark .ql-toolbar {
                background-color: #1f2937 !important;
                border-color: #374151 !important;
              }
              .dark .ql-toolbar .ql-stroke {
                stroke: #d1d5db !important;
              }
              .dark .ql-toolbar .ql-fill {
                fill: #d1d5db !important;
              }
              .dark .ql-toolbar button:hover,
              .dark .ql-toolbar button.ql-active {
                background-color: #374151 !important;
              }
              .dark .ql-container {
                background-color: #1f2937 !important;
                border-color: #374151 !important;
              }
              .dark .ql-editor {
                color: #f9fafb !important;
                background-color: #1f2937 !important;
              }
              .dark .ql-editor.ql-blank::before {
                color: #9ca3af !important;
              }
            `}</style>
          </>
        ) : (
          <div className="min-h-[200px] p-4">
            <p className="text-sm text-muted-foreground">Loading editor...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const { currentTemplate, selectedSectionId, updateSection, selectSection } =
    useBuilderStore();

  const section = currentTemplate?.sections.find(
    (s) => s.id === selectedSectionId,
  );

  if (!section) {
    return (
      <div
        className="h-[calc(100vh-4rem) w-80 bg-muted/30 border-l border-border p-6"
        data-testid="properties-panel"
      >
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Select a section to edit content</p>
        </div>
      </div>
    );
  }

  const updateData = (key: string, value: unknown) => {
    updateSection(section.id, {
      data: { ...section.data, [key]: value },
    });
  };

  const renderContentEditor = () => {
    switch (section.type) {
      case "header": {
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs" htmlFor="name">
                Name
              </Label>
              <Input
                className="mt-1"
                id="name"
                onChange={(e) => updateData("name", e.target.value)}
                placeholder="Full Name"
                value={String(section.data.name || "")}
              />
            </div>
            <div>
              <Label className="text-xs" htmlFor="title">
                Title
              </Label>
              <Input
                className="mt-1"
                id="title"
                onChange={(e) => updateData("title", e.target.value)}
                placeholder="Job Title"
                value={String(section.data.title || "")}
              />
            </div>
            <div>
              <Label className="text-xs" htmlFor="contact">
                Contact
              </Label>
              <Input
                className="mt-1"
                id="contact"
                onChange={(e) => updateData("contact", e.target.value)}
                placeholder="Contact information"
                value={String(section.data.contact || "")}
              />
            </div>
            <div>
              <Label className="text-xs" htmlFor="email">
                Email
              </Label>
              <Input
                className="mt-1"
                id="email"
                onChange={(e) => updateData("email", e.target.value)}
                placeholder="email@example.com"
                type="email"
                value={String(section.data.email || "")}
              />
            </div>
            <div>
              <Label className="text-xs" htmlFor="phone">
                Phone
              </Label>
              <Input
                className="mt-1"
                id="phone"
                onChange={(e) => updateData("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                value={String(section.data.phone || "")}
              />
            </div>
            <div>
              <Label className="text-xs" htmlFor="location">
                Location
              </Label>
              <Input
                className="mt-1"
                id="location"
                onChange={(e) => updateData("location", e.target.value)}
                placeholder="City, State"
                value={String(section.data.location || "")}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Social Links</Label>
                <Button
                  onClick={() => {
                    const socialLinks = Array.isArray(section.data.socialLinks)
                      ? [...(section.data.socialLinks as SocialLink[])]
                      : [];
                    updateData("socialLinks", [
                      ...socialLinks,
                      { link: "", name: "" },
                    ]);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Link
                </Button>
              </div>
              <div className="space-y-2">
                {Array.isArray(section.data.socialLinks) &&
                  (section.data.socialLinks as SocialLink[]).map(
                    (link, idx) => (
                      <div
                        className="p-3 border rounded-lg space-y-2 bg-background"
                        key={`social-${link.name}-${link.link}-${idx}`}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">
                            Link {idx + 1}
                          </Label>
                          <Button
                            onClick={() => {
                              const socialLinks = Array.isArray(
                                section.data.socialLinks,
                              )
                                ? [
                                    ...(section.data
                                      .socialLinks as SocialLink[]),
                                  ]
                                : [];
                              updateData(
                                "socialLinks",
                                socialLinks.filter((_, i) => i !== idx),
                              );
                            }}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div>
                          <Label
                            className="text-xs"
                            htmlFor={`social-name-${idx}`}
                          >
                            Name
                          </Label>
                          <Input
                            className="mt-1"
                            id={`social-name-${idx}`}
                            onChange={(e) => {
                              const socialLinks = Array.isArray(
                                section.data.socialLinks,
                              )
                                ? [
                                    ...(section.data
                                      .socialLinks as SocialLink[]),
                                  ]
                                : [];
                              socialLinks[idx] = {
                                link: socialLinks[idx]?.link || "",
                                name: e.target.value,
                              };
                              updateData("socialLinks", socialLinks);
                            }}
                            placeholder="LinkedIn"
                            value={link.name || ""}
                          />
                        </div>
                        <div>
                          <Label
                            className="text-xs"
                            htmlFor={`social-link-${idx}`}
                          >
                            URL
                          </Label>
                          <Input
                            className="mt-1"
                            id={`social-link-${idx}`}
                            onChange={(e) => {
                              const socialLinks = Array.isArray(
                                section.data.socialLinks,
                              )
                                ? [
                                    ...(section.data
                                      .socialLinks as SocialLink[]),
                                  ]
                                : [];
                              socialLinks[idx] = {
                                link: e.target.value,
                                name: socialLinks[idx]?.name || "",
                              };
                              updateData("socialLinks", socialLinks);
                            }}
                            placeholder="https://linkedin.com/in/username"
                            type="url"
                            value={link.link || ""}
                          />
                        </div>
                      </div>
                    ),
                  )}
              </div>
            </div>
          </div>
        );
      }

      case "summary": {
        return (
          <div className="space-y-4">
            <RichTextEditor
              label="Summary Content"
              onChange={(value) => updateData("content", value)}
              value={String(section.data.content || "")}
            />
          </div>
        );
      }

      case "experience": {
        const entries = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as ExperienceEntry[];

        const addEntry = () => {
          const newEntry: ExperienceEntry = {
            company: "" as string,
            description: "" as string,
            endDate: "" as string,
            position: "" as string,
            startDate: "" as string,
          };
          updateData("entries", [...entries, newEntry]);
        };

        const updateEntry = (index: number, field: string, value: string) => {
          const updated = [...entries];
          updated[index] = {
            ...updated[index],
            [field]: value,
          } as ExperienceEntry;
          updateData("entries", updated);
        };

        const deleteEntry = (index: number) => {
          const updated = entries.filter((_, i) => i !== index);
          updateData("entries", updated);
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Work Experience</Label>
              <Button
                onClick={addEntry}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
            </div>
            {entries.map((entry, idx) => (
              <div
                className="p-3 border rounded-lg space-y-3 bg-background"
                key={`exp-${entry.company}-${entry.position}-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Entry {idx + 1}</Label>
                  <Button
                    onClick={() => deleteEntry(idx)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`exp-company-${idx}`}>
                    Company
                  </Label>
                  <Input
                    className="mt-1"
                    id={`exp-company-${idx}`}
                    onChange={(e) =>
                      updateEntry(idx, "company", e.target.value)
                    }
                    placeholder="Company Name"
                    value={entry.company || ""}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`exp-position-${idx}`}>
                    Position
                  </Label>
                  <Input
                    className="mt-1"
                    id={`exp-position-${idx}`}
                    onChange={(e) =>
                      updateEntry(idx, "position", e.target.value)
                    }
                    placeholder="Job Title"
                    value={entry.position || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs" htmlFor={`exp-start-${idx}`}>
                      Start Date
                    </Label>
                    <Input
                      className="mt-1"
                      id={`exp-start-${idx}`}
                      onChange={(e) =>
                        updateEntry(idx, "startDate", e.target.value)
                      }
                      placeholder="2020"
                      value={entry.startDate || ""}
                    />
                  </div>
                  <div>
                    <Label className="text-xs" htmlFor={`exp-end-${idx}`}>
                      End Date
                    </Label>
                    <Input
                      className="mt-1"
                      id={`exp-end-${idx}`}
                      onChange={(e) =>
                        updateEntry(idx, "endDate", e.target.value)
                      }
                      placeholder="Present"
                      value={entry.endDate || ""}
                    />
                  </div>
                </div>
                <div>
                  <RichTextEditor
                    label="Description"
                    onChange={(value) => updateEntry(idx, "description", value)}
                    value={entry.description || ""}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "education": {
        const entries = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as EducationEntry[];

        const addEntry = () => {
          const newEntry: EducationEntry = {
            degree: "" as string,
            institution: "" as string,
            year: "" as string,
          };
          updateData("entries", [...entries, newEntry]);
        };

        const updateEntry = (index: number, field: string, value: string) => {
          const updated = [...entries];
          updated[index] = {
            ...updated[index],
            [field]: value,
          } as EducationEntry;
          updateData("entries", updated);
        };

        const deleteEntry = (index: number) => {
          const updated = entries.filter((_, i) => i !== index);
          updateData("entries", updated);
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Education</Label>
              <Button
                onClick={addEntry}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
            </div>
            {entries.map((entry, idx) => (
              <div
                className="p-3 border rounded-lg space-y-3 bg-background"
                key={`edu-${entry.institution}-${entry.degree}-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Entry {idx + 1}</Label>
                  <Button
                    onClick={() => deleteEntry(idx)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`edu-institution-${idx}`}>
                    Institution
                  </Label>
                  <Input
                    className="mt-1"
                    id={`edu-institution-${idx}`}
                    onChange={(e) =>
                      updateEntry(idx, "institution", e.target.value)
                    }
                    placeholder="University Name"
                    value={entry.institution || ""}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`edu-degree-${idx}`}>
                    Degree
                  </Label>
                  <Input
                    className="mt-1"
                    id={`edu-degree-${idx}`}
                    onChange={(e) => updateEntry(idx, "degree", e.target.value)}
                    placeholder="Degree Name"
                    value={entry.degree || ""}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`edu-year-${idx}`}>
                    Year
                  </Label>
                  <Input
                    className="mt-1"
                    id={`edu-year-${idx}`}
                    onChange={(e) => updateEntry(idx, "year", e.target.value)}
                    placeholder="2020"
                    value={entry.year || ""}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "skills": {
        const items = Array.isArray(section.data.items)
          ? section.data.items
          : [];
        const category = String(section.data.category || "");

        const addSkill = () => {
          updateData("items", [...items, ""]);
        };

        const updateSkill = (index: number, value: string) => {
          const updated = [...items];
          updated[index] = value;
          updateData("items", updated);
        };

        const deleteSkill = (index: number) => {
          const updated = items.filter((_, i) => i !== index);
          updateData("items", updated);
        };

        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs" htmlFor="category">
                Category
              </Label>
              <Input
                className="mt-1"
                id="category"
                onChange={(e) => updateData("category", e.target.value)}
                placeholder="Technical Skills"
                value={category}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Skills</Label>
                <Button
                  onClick={addSkill}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Skill
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((skill, idx) => (
                  <div
                    className="flex gap-2"
                    key={`skill-${String(skill)}-${idx}`}
                  >
                    <Input
                      className="flex-1"
                      onChange={(e) => updateSkill(idx, e.target.value)}
                      placeholder="Skill name"
                      value={String(skill || "")}
                    />
                    <Button
                      onClick={() => deleteSkill(idx)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "certifications": {
        const entries = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as CertificationEntry[];

        const addEntry = () => {
          const newEntry: CertificationEntry = {
            date: "",
            issuer: "",
            link: "",
            name: "",
          };
          updateData("entries", [...entries, newEntry]);
        };

        const updateEntry = (index: number, field: string, value: string) => {
          const updated = [...entries];
          updated[index] = {
            ...updated[index],
            [field]: value,
          } as CertificationEntry;
          updateData("entries", updated);
        };

        const deleteEntry = (index: number) => {
          const updated = entries.filter((_, i) => i !== index);
          updateData("entries", updated);
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Certifications</Label>
              <Button
                onClick={addEntry}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
            </div>
            {entries.map((entry, idx) => (
              <div
                className="p-3 border rounded-lg space-y-3 bg-background"
                key={`cert-${entry.name}-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Entry {idx + 1}</Label>
                  <Button
                    onClick={() => deleteEntry(idx)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`cert-name-${idx}`}>
                    Certification Name
                  </Label>
                  <Input
                    className="mt-1"
                    id={`cert-name-${idx}`}
                    onChange={(e) => updateEntry(idx, "name", e.target.value)}
                    placeholder="AWS Certified Solutions Architect"
                    value={entry.name || ""}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`cert-issuer-${idx}`}>
                    Issuer
                  </Label>
                  <Input
                    className="mt-1"
                    id={`cert-issuer-${idx}`}
                    onChange={(e) => updateEntry(idx, "issuer", e.target.value)}
                    placeholder="Amazon Web Services"
                    value={entry.issuer || ""}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`cert-date-${idx}`}>
                    Date
                  </Label>
                  <Input
                    className="mt-1"
                    id={`cert-date-${idx}`}
                    onChange={(e) => updateEntry(idx, "date", e.target.value)}
                    placeholder="2023"
                    value={entry.date || ""}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`cert-link-${idx}`}>
                    Link (Optional)
                  </Label>
                  <Input
                    className="mt-1"
                    id={`cert-link-${idx}`}
                    onChange={(e) => updateEntry(idx, "link", e.target.value)}
                    placeholder="https://www.credly.com/badges/..."
                    type="url"
                    value={entry.link || ""}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "projects": {
        const entries = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as ProjectEntry[];

        const addEntry = () => {
          const newEntry: ProjectEntry = {
            date: "",
            description: "",
            link: "",
            name: "",
            technologies: [],
          };
          updateData("entries", [...entries, newEntry]);
        };

        const updateEntry = (
          index: number,
          field: string,
          value: string | string[],
        ) => {
          const updated = [...entries];
          updated[index] = {
            ...updated[index],
            [field]: value,
          } as ProjectEntry;
          updateData("entries", updated);
        };

        const deleteEntry = (index: number) => {
          const updated = entries.filter((_, i) => i !== index);
          updateData("entries", updated);
        };

        const addTechnology = (index: number) => {
          const entry = entries[index];
          if (!entry) return;
          const technologies = Array.isArray(entry.technologies)
            ? [...entry.technologies]
            : [];
          updateEntry(index, "technologies", [...technologies, ""]);
        };

        const updateTechnology = (
          entryIndex: number,
          techIndex: number,
          value: string,
        ) => {
          const entry = entries[entryIndex];
          if (!entry) return;
          const technologies = Array.isArray(entry.technologies)
            ? [...entry.technologies]
            : [];
          technologies[techIndex] = value;
          updateEntry(entryIndex, "technologies", technologies);
        };

        const deleteTechnology = (entryIndex: number, techIndex: number) => {
          const entry = entries[entryIndex];
          if (!entry) return;
          const technologies = Array.isArray(entry.technologies)
            ? [...entry.technologies]
            : [];
          updateEntry(
            entryIndex,
            "technologies",
            technologies.filter((_, i) => i !== techIndex),
          );
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Projects</Label>
              <Button
                onClick={addEntry}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
            </div>
            {entries.map((entry, idx) => (
              <div
                className="p-3 border rounded-lg space-y-3 bg-background"
                key={`project-${entry.name}-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Entry {idx + 1}</Label>
                  <Button
                    onClick={() => deleteEntry(idx)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`project-name-${idx}`}>
                    Project Name
                  </Label>
                  <Input
                    className="mt-1"
                    id={`project-name-${idx}`}
                    onChange={(e) => updateEntry(idx, "name", e.target.value)}
                    placeholder="E-commerce Platform"
                    value={entry.name || ""}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`project-date-${idx}`}>
                    Date
                  </Label>
                  <Input
                    className="mt-1"
                    id={`project-date-${idx}`}
                    onChange={(e) => updateEntry(idx, "date", e.target.value)}
                    placeholder="2023"
                    value={entry.date || ""}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`project-link-${idx}`}>
                    Link (Optional)
                  </Label>
                  <Input
                    className="mt-1"
                    id={`project-link-${idx}`}
                    onChange={(e) => updateEntry(idx, "link", e.target.value)}
                    placeholder="https://github.com/user/project"
                    type="url"
                    value={entry.link || ""}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Technologies</Label>
                    <Button
                      onClick={() => addTechnology(idx)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Technology
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(entry.technologies) &&
                      entry.technologies.map((tech, techIdx) => (
                        <div
                          className="flex gap-2"
                          key={`tech-${String(tech)}-${techIdx}`}
                        >
                          <Input
                            className="flex-1"
                            onChange={(e) =>
                              updateTechnology(idx, techIdx, e.target.value)
                            }
                            placeholder="React"
                            value={String(tech || "")}
                          />
                          <Button
                            onClick={() => deleteTechnology(idx, techIdx)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <RichTextEditor
                    label="Description"
                    onChange={(value) => updateEntry(idx, "description", value)}
                    value={entry.description || ""}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      }

      case "languages": {
        const entries = (
          Array.isArray(section.data.entries) ? section.data.entries : []
        ) as LanguageEntry[];

        const addEntry = () => {
          const newEntry: LanguageEntry = {
            language: "",
            proficiency: "Intermediate",
          };
          updateData("entries", [...entries, newEntry]);
        };

        const updateEntry = (index: number, field: string, value: string) => {
          const updated = [...entries];
          updated[index] = {
            ...updated[index],
            [field]: value,
          } as LanguageEntry;
          updateData("entries", updated);
        };

        const deleteEntry = (index: number) => {
          const updated = entries.filter((_, i) => i !== index);
          updateData("entries", updated);
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Languages</Label>
              <Button
                onClick={addEntry}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
            </div>
            {entries.map((entry, idx) => (
              <div
                className="p-3 border rounded-lg space-y-3 bg-background"
                key={`lang-${entry.language}-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Entry {idx + 1}</Label>
                  <Button
                    onClick={() => deleteEntry(idx)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs" htmlFor={`lang-name-${idx}`}>
                    Language
                  </Label>
                  <Input
                    className="mt-1"
                    id={`lang-name-${idx}`}
                    onChange={(e) =>
                      updateEntry(idx, "language", e.target.value)
                    }
                    placeholder="English"
                    value={entry.language || ""}
                  />
                </div>
                <div>
                  <Label
                    className="text-xs"
                    htmlFor={`lang-proficiency-${idx}`}
                  >
                    Proficiency
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      updateEntry(idx, "proficiency", value)
                    }
                    value={entry.proficiency}
                  >
                    <SelectTrigger
                      className="mt-1"
                      id={`lang-proficiency-${idx}`}
                    >
                      <SelectValue placeholder="Select proficiency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Fluent">Fluent</SelectItem>
                      <SelectItem value="Native">Native</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        );
      }

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Content editing not available for this section type.
          </div>
        );
    }
  };

  return (
    <div
      className="h-[calc(100vh-4rem)] w-80 bg-muted/30 border-l border-border overflow-y-auto"
      data-testid="properties-panel"
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3
          className="font-semibold text-foreground"
          data-testid="content-editor-heading"
        >
          Content Editor
        </h3>
        <Button
          className="h-8 w-8"
          onClick={() => selectSection(null)}
          size="icon"
          title="Close"
          type="button"
          variant="ghost"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">{renderContentEditor()}</div>
    </div>
  );
}

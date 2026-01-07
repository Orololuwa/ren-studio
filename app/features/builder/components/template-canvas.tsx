import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useBuilderStore } from "../store/builder-store";
import type { TemplateSection } from "../types";
import { componentLibrary } from "./component-library";
import { SectionRenderer } from "./section-renderer";
import { SectionWrapper } from "./section-wrapper";

// Create default section config for new sections with mock data
function createDefaultSectionConfig(
  type: string,
): Omit<TemplateSection, "id" | "order"> {
  const component = componentLibrary[type];
  if (!component) {
    throw new Error(`Component type ${type} not found`);
  }

  // Mock data for each section type
  const mockData: Record<string, Record<string, unknown>> = {
    certifications: {
      entries: [
        {
          date: "2023",
          issuer: "Amazon Web Services",
          link: "https://www.credly.com/badges/example",
          name: "AWS Certified Solutions Architect",
        },
      ],
    },
    education: {
      entries: [
        {
          degree: "Bachelor of Science in Computer Science",
          institution: "University of Technology",
          year: "2018",
        },
        {
          degree: "Advanced Web Development Certificate",
          institution: "Online Course Platform",
          year: "2019",
        },
      ],
    },
    experience: {
      entries: [
        {
          company: "Tech Company Inc.",
          description:
            "<ul><li>Led development of key features and mentored junior developers</li><li>Improved system performance and code quality</li><li>Collaborated with cross-functional teams</li></ul>",
          endDate: "Present",
          position: "Senior Developer",
          startDate: "2020",
        },
        {
          company: "StartupXYZ",
          description:
            "<ul><li>Built and maintained web applications using modern frameworks</li><li>Collaborated with cross-functional teams</li><li>Implemented best practices and coding standards</li></ul>",
          endDate: "2020",
          position: "Full Stack Developer",
          startDate: "2018",
        },
      ],
    },
    header: {
      contact: "",
      email: "john.doe@example.com",
      location: "San Francisco, CA",
      name: "John Doe",
      phone: "+1 (555) 123-4567",
      socialLinks: [
        { link: "https://linkedin.com/in/johndoe", name: "LinkedIn" },
        { link: "https://github.com/johndoe", name: "GitHub" },
      ],
      title: "Software Engineer",
    },
    languages: {
      entries: [
        { language: "English", proficiency: "Native" },
        { language: "Spanish", proficiency: "Fluent" },
      ],
    },
    projects: {
      entries: [
        {
          date: "2023",
          description:
            "<p>Built a full-stack e-commerce platform with React and Node.js.</p>",
          link: "https://github.com/user/project",
          name: "E-commerce Platform",
          technologies: ["React", "Node.js", "PostgreSQL"],
        },
      ],
    },
    skills: {
      category: "Technical Skills",
      items: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker"],
    },
    summary: {
      content:
        "<p>Experienced professional with expertise in modern technologies and best practices. Passionate about building scalable solutions and delivering high-quality results.</p>",
    },
  };

  return {
    data: mockData[type] || { ...component.defaultData },
    styles: { ...component.defaultStyles },
    type: component.type as TemplateSection["type"],
  };
}

export function TemplateCanvas() {
  const {
    currentTemplate,
    selectedSectionId,
    selectSection,
    addSection,
    reorderSections,
  } = useBuilderStore();

  // Monitor drag and drop events from parent DndContext
  useDndMonitor({
    onDragEnd(event) {
      const { active, over } = event;

      if (!over || !currentTemplate) return;

      const activeId = active.id.toString();
      const overId = over.id.toString();

      // Check if dragging from palette to canvas
      if (activeId.startsWith("palette-")) {
        const sectionType = activeId.replace("palette-", "");
        const baseSection = createDefaultSectionConfig(sectionType);
        const maxOrder = Math.max(
          ...currentTemplate.sections.map((s) => s.order),
          -1,
        );

        // If dropping on a specific section, insert at that position
        if (overId !== "canvas-droppable") {
          const targetIndex = currentTemplate.sections.findIndex(
            (s) => s.id === overId,
          );
          if (targetIndex !== -1) {
            // Insert at the target position
            const newSectionWithId: TemplateSection = {
              ...baseSection,
              id: crypto.randomUUID(),
              order: targetIndex,
            };

            // Update all sections to reorder
            const updatedSections = [
              ...currentTemplate.sections.slice(0, targetIndex),
              newSectionWithId,
              ...currentTemplate.sections.slice(targetIndex),
            ].map((s, index) => ({ ...s, order: index }));

            reorderSections(updatedSections);
          } else {
            // Fallback: add to the end
            const newSection: TemplateSection = {
              ...baseSection,
              id: crypto.randomUUID(),
              order: maxOrder + 1,
            };
            addSection(newSection);
          }
        } else {
          // Dropped on empty canvas, just add to the end
          const newSection: TemplateSection = {
            ...baseSection,
            id: crypto.randomUUID(),
            order: maxOrder + 1,
          };
          addSection(newSection);
        }
        return;
      }

      // Reordering sections within canvas
      if (
        activeId !== overId &&
        !activeId.startsWith("palette-") &&
        !overId.startsWith("palette-")
      ) {
        // Sort sections by order to ensure correct indices
        const sortedSections = [...currentTemplate.sections].sort(
          (a, b) => a.order - b.order,
        );

        const oldIndex = sortedSections.findIndex((s) => s.id === activeId);

        if (oldIndex === -1) return;

        // If dropped on canvas-droppable (empty area), move to end
        if (overId === "canvas-droppable") {
          const reordered = arrayMove(
            sortedSections,
            oldIndex,
            sortedSections.length - 1,
          );
          const reorderedWithOrder = reordered.map((section, index) => ({
            ...section,
            order: index,
          }));
          reorderSections(reorderedWithOrder);
          return;
        }

        // Dropped on another section - insert at that position
        const newIndex = sortedSections.findIndex((s) => s.id === overId);

        if (newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(sortedSections, oldIndex, newIndex);
          // Update order values to match new positions
          const reorderedWithOrder = reordered.map((section, index) => ({
            ...section,
            order: index,
          }));
          reorderSections(reorderedWithOrder);
        }
      }
    },
  });

  if (!currentTemplate) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No template selected
      </div>
    );
  }

  const sortedSections = [...currentTemplate.sections].sort(
    (a, b) => a.order - b.order,
  );

  // Create a droppable canvas area
  const DroppableCanvas = () => {
    const { setNodeRef, isOver } = useDroppable({
      id: "canvas-droppable",
    });

    return (
      <div
        className={`min-h-[600px] p-4 rounded-lg transition-colors ${
          isOver
            ? "bg-blue-50 border-2 border-blue-500 border-dashed"
            : "border-2 border-transparent"
        } ${
          sortedSections.length === 0 ? "flex items-center justify-center" : ""
        }`}
        data-testid="canvas-droppable"
        ref={setNodeRef}
      >
        {sortedSections.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="mb-4">
              <svg
                aria-label="Document icon"
                className="w-16 h-16 mx-auto text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Document</title>
                <path
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">
              Start Building Your Template
            </h3>
            <p className="text-sm text-gray-500">
              Drag components from the right panel to add them here
            </p>
          </div>
        ) : (
          <SortableContext
            items={sortedSections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedSections.map((section) => (
              <SectionWrapper
                isSelected={selectedSectionId === section.id}
                key={section.id}
                onSelect={() => selectSection(section.id)}
                section={section}
              >
                <SectionRenderer
                  isSelected={selectedSectionId === section.id}
                  onSelect={() => selectSection(section.id)}
                  section={section}
                />
              </SectionWrapper>
            ))}
          </SortableContext>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex-1 bg-gray-100 p-8 overflow-auto"
      data-testid="template-canvas"
    >
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <DroppableCanvas />
      </div>
    </div>
  );
}

import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useBuilderStore } from "../store/builder-store";
import type { Template, TemplateSection } from "../types";
import { generateSectionId } from "../utils/generate-section-id";
import { componentLibrary } from "./component-library-registry";
import { SectionRenderer } from "./section-renderer";
import { SectionWrapper } from "./section-wrapper";

// Create default section config for new sections using template data
function createDefaultSectionConfig(
  type: string,
  existingSections: TemplateSection[] = [],
  sourceTemplate: Template | null = null,
): Omit<TemplateSection, "id" | "order"> {
  const component = componentLibrary[type];
  if (!component) {
    throw new Error(`Component type ${type} not found`);
  }

  // Try to find an existing section of the same type to inherit styles from
  const existingSectionOfType = existingSections.find(
    (section) => section.type === type,
  );

  // Build default styles from template or component defaults
  let defaultStyles: Record<string, string>;

  // Priority 1: If we have an existing section of the same type, use its styles directly
  if (existingSectionOfType) {
    defaultStyles = { ...existingSectionOfType.styles };
  } else if (sourceTemplate) {
    // Priority 2: Check source template for the section type (original default template)
    const sourceSectionOfType = sourceTemplate.sections.find(
      (s: TemplateSection) => s.type === type,
    );
    if (sourceSectionOfType) {
      defaultStyles = { ...sourceSectionOfType.styles };
    } else {
      // Priority 3: Fall back to component defaults if not in source template
      defaultStyles = { ...component.defaultStyles };
    }
  } else {
    // No source template available, use component defaults
    defaultStyles = { ...component.defaultStyles };
  }

  // Build default data from template or component defaults
  let defaultData: Record<string, unknown>;

  // If we have an existing section of the same type, use its data
  if (existingSectionOfType) {
    defaultData = { ...existingSectionOfType.data };
  } else if (sourceTemplate) {
    // Check source template for section data
    const sourceSectionOfType = sourceTemplate.sections.find(
      (s: TemplateSection) => s.type === type,
    );
    if (sourceSectionOfType) {
      defaultData = { ...sourceSectionOfType.data };
    } else {
      // No existing section of this type, use component defaults
      defaultData = { ...component.defaultData };
    }
  } else {
    // No existing section of this type, use component defaults
    defaultData = { ...component.defaultData };
  }

  return {
    data: defaultData,
    styles: defaultStyles,
    type: component.type as TemplateSection["type"],
    // New sections default to using the global palette
    usingGlobalPalette: true,
  };
}

export function TemplateCanvas() {
  const {
    currentTemplate,
    selectedSectionId,
    selectSection,
    addSection,
    reorderSections,
    sourceTemplate,
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
        const sectionType = activeId.replace(
          "palette-",
          "",
        ) as TemplateSection["type"];

        // Check if section type already exists (prevent duplicates)
        const existingSectionOfType = currentTemplate.sections.find(
          (s) => s.type === sectionType,
        );
        if (existingSectionOfType) {
          // Section type already exists, don't allow duplicate
          return;
        }

        const baseSection = createDefaultSectionConfig(
          sectionType,
          currentTemplate.sections,
          sourceTemplate,
        );
        const maxOrder = Math.max(
          ...currentTemplate.sections.map((s) => s.order),
          -1,
        );

        // Generate predictable section ID
        const sectionId = generateSectionId(currentTemplate.type, sectionType);

        // If dropping on a specific section, insert at that position
        if (overId !== "canvas-droppable") {
          const targetIndex = currentTemplate.sections.findIndex(
            (s) => s.id === overId,
          );
          if (targetIndex !== -1) {
            // Insert at the target position
            const newSectionWithId: TemplateSection = {
              ...baseSection,
              id: sectionId,
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
              id: sectionId,
              order: maxOrder + 1,
            };
            addSection(newSection);
          }
        } else {
          // Dropped on empty canvas, just add to the end
          const newSection: TemplateSection = {
            ...baseSection,
            id: sectionId,
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
        className={`min-h-[400px] md:min-h-[600px] p-2 md:p-4 rounded-lg transition-colors bg-card ${
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
      className="flex-1 bg-muted p-2 md:p-4 lg:p-8 overflow-auto"
      data-testid="template-canvas"
    >
      <div className="max-w-4xl mx-auto bg-card shadow-lg rounded-lg p-4 md:p-6 lg:p-8">
        <DroppableCanvas />
      </div>
    </div>
  );
}

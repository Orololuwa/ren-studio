import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";

import { useBuilderStore } from "../store/builder-store";
import type { TemplateSection } from "../types";
import { Button } from "~/components/ui/button";

interface SectionWrapperProps {
  section: TemplateSection;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}

export function SectionWrapper({
  section,
  children,
  isSelected,
  onSelect,
}: SectionWrapperProps) {
  const { deleteSection, updateSection } = useBuilderStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
  });

  const style = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentVisible = section.styles.visibility !== "hidden";
    updateSection(section.id, {
      styles: {
        ...section.styles,
        visibility: currentVisible ? "hidden" : "visible",
      },
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSection(section.id);
  };

  const isVisible = section.styles.visibility !== "hidden";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <section
      aria-label={`${section.type} section`}
      className={`relative border-2 rounded-lg mb-4 bg-white cursor-pointer ${
        isSelected ? "border-blue-500 shadow-lg" : "border-gray-300"
      } ${!isVisible ? "opacity-60" : ""}`}
      data-testid={`section-${section.id}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      ref={setNodeRef}
      style={style}
    >
      {/* Section Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        <Button
          className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          data-testid={`section-visibility-toggle-${section.id}`}
          onClick={handleToggleVisibility}
          size="icon"
          title={isVisible ? "Hide section" : "Show section"}
          type="button"
          variant="ghost"
        >
          {isVisible ? (
            <Eye className="w-4 h-4 text-gray-700" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-700" />
          )}
        </Button>
        <Button
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          data-testid={`section-delete-${section.id}`}
          onClick={handleDelete}
          size="icon"
          title="Delete section"
          type="button"
          variant="ghost"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
        <Button
          type="button"
          {...attributes}
          {...listeners}
          className="h-8 w-8 cursor-grab active:cursor-grabbing text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          data-testid={`section-drag-handle-${section.id}`}
          size="icon"
          title="Drag to reorder"
          variant="ghost"
        >
          <GripVertical className="w-4 h-4 text-gray-700" />
        </Button>
      </div>

      {/* Section Label */}
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-300 rounded-t-lg">
        <h2 className="text-sm font-semibold text-gray-900">
          {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
        </h2>
      </div>

      {/* Section Content */}
      <div className="overflow-hidden rounded-b-lg">{children}</div>
    </section>
  );
}

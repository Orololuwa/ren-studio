import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";

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
  const { deleteSection, duplicateSection, updateSection } = useBuilderStore();
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

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Pass the section to duplicate - the store will handle inserting it right after
    duplicateSection(section);
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
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      ref={setNodeRef}
      style={style}
    >
      {/* Section Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        <Button
          className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
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
          className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleDuplicate}
          size="icon"
          title="Duplicate section"
          type="button"
          variant="ghost"
        >
          <Copy className="w-4 h-4 text-gray-700" />
        </Button>
        <Button
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
          size="icon"
          title="Drag to reorder"
          variant="ghost"
        >
          <GripVertical className="w-4 h-4 text-gray-700" />
        </Button>
      </div>

      {/* Section Label */}
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-300 rounded-t-lg">
        <h3 className="text-sm font-semibold text-gray-900">
          {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
        </h3>
      </div>

      {/* Section Content */}
      <div>{children}</div>
    </section>
  );
}

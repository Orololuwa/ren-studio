import { useDraggable } from "@dnd-kit/core";
import { Briefcase, FileText, GraduationCap, Star } from "lucide-react";

import type { ComponentDefinition } from "../types";
import { componentLibrary } from "./component-library";

const iconMap: Record<string, React.ReactNode> = {
  education: <GraduationCap className="w-5 h-5" />,
  experience: <Briefcase className="w-5 h-5" />,
  header: <FileText className="w-5 h-5" />,
  skills: <Star className="w-5 h-5" />,
  summary: <FileText className="w-5 h-5" />,
};

export function ComponentPalette() {
  return (
    <div className="h-[calc(100vh-4rem)] w-80 bg-muted/30 border-l border-border overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-2">Components</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Drag components to add them to your template
        </p>

        <div className="space-y-3">
          {Object.values(componentLibrary).map((component) => (
            <DraggableComponent component={component} key={component.type} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DraggableComponent({ component }: { component: ComponentDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    data: { type: component.type },
    id: `palette-${component.type}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 bg-background border-2 rounded-lg cursor-grab hover:border-primary hover:shadow-md transition-all select-none ${
        isDragging ? "opacity-50 border-primary" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-primary mt-0.5">{iconMap[component.type]}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">{component.label}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {component.configurableProperties.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}

import { useDraggable } from "@dnd-kit/core";
import {
  Award,
  Briefcase,
  FileText,
  FolderKanban,
  GraduationCap,
  Languages,
  List,
  Star,
} from "lucide-react";

import { useBuilderStore } from "../store/builder-store";
import type { ComponentDefinition } from "../types";
import { componentLibrary } from "./component-library-registry";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

const iconMap: Record<string, React.ReactNode> = {
  certifications: <Award className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  experience: <Briefcase className="w-5 h-5" />,
  header: <FileText className="w-5 h-5" />,
  languages: <Languages className="w-5 h-5" />,
  projects: <FolderKanban className="w-5 h-5" />,
  skills: <Star className="w-5 h-5" />,
  summary: <FileText className="w-5 h-5" />,
  "invoice-header": <FileText className="w-5 h-5" />,
  "invoice-items": <List className="w-5 h-5" />,
  "invoice-footer": <FileText className="w-5 h-5" />,
};

export function ComponentPalette({
  initialTemplateType,
  asSheet = false,
  open,
  onOpenChange,
  trigger,
}: {
  initialTemplateType?: string;
  asSheet?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
} = {}) {
  const { currentTemplate } = useBuilderStore();
  // Use currentTemplate type if available, otherwise fall back to initialTemplateType
  const templateType = currentTemplate?.type || initialTemplateType;

  // Get components based on template type
  const getComponentsForType = (type: string | undefined): string[] => {
    if (!type) {
      return []; // No template loaded, show empty palette
    }
    switch (type) {
      case "invoice":
        return ["invoice-header", "invoice-items", "invoice-footer"];
      case "receipt":
        return ["receipt-header", "receipt-items", "receipt-footer"];
      case "resume":
        return [
          "header",
          "summary",
          "experience",
          "education",
          "skills",
          "projects",
          "certifications",
          "languages",
        ];
      default:
        return [];
    }
  };

  const componentTypes = getComponentsForType(templateType);

  const paletteContent = (
    <div className="p-4">
      <h2
        className="text-lg font-bold mb-2"
        data-testid="component-palette-heading"
      >
        Components
      </h2>
      <p
        className="text-xs text-muted-foreground mb-4"
        data-testid="component-palette-instruction"
      >
        Drag components to add them to your template
      </p>

      {!templateType ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Load a template to see available components
        </div>
      ) : componentTypes.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          No components available for this template type
        </div>
      ) : (
        <div className="space-y-3" data-testid="component-palette-list">
          {componentTypes
            .map((type) => componentLibrary[type])
            .filter(
              (component): component is ComponentDefinition =>
                component !== undefined,
            )
            .map((component) => (
              <DraggableComponent component={component} key={component.type} />
            ))}
        </div>
      )}
    </div>
  );

  if (asSheet) {
    return (
      <Sheet onOpenChange={onOpenChange} open={open}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent className="w-80 sm:w-80" side="right">
          <SheetHeader>
            <SheetTitle>Components</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto h-[calc(100vh-8rem)]">
            {paletteContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="h-[calc(100vh-4rem)] w-80 bg-muted/30 border-l border-border overflow-y-auto hidden md:block"
      data-testid="component-palette"
    >
      {paletteContent}
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
      data-testid={`palette-${component.type}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-primary mt-0.5">{iconMap[component.type]}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1">{component.label}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {component.configurableProperties.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}

import { useDraggable } from "@dnd-kit/core";
import {
  Award,
  Briefcase,
  Check,
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
  "quote-header": <FileText className="w-5 h-5" />,
  "quote-items": <List className="w-5 h-5" />,
  "quote-footer": <FileText className="w-5 h-5" />,
  "estimate-header": <FileText className="w-5 h-5" />,
  "estimate-items": <List className="w-5 h-5" />,
  "estimate-footer": <FileText className="w-5 h-5" />,
  "purchase-order-header": <FileText className="w-5 h-5" />,
  "purchase-order-items": <List className="w-5 h-5" />,
  "purchase-order-footer": <FileText className="w-5 h-5" />,
  "sales-order-header": <FileText className="w-5 h-5" />,
  "sales-order-items": <List className="w-5 h-5" />,
  "sales-order-footer": <FileText className="w-5 h-5" />,
  "order-confirmation-header": <FileText className="w-5 h-5" />,
  "order-confirmation-items": <List className="w-5 h-5" />,
  "order-confirmation-footer": <FileText className="w-5 h-5" />,
  "packing-slip-header": <FileText className="w-5 h-5" />,
  "packing-slip-items": <List className="w-5 h-5" />,
  "packing-slip-footer": <FileText className="w-5 h-5" />,
  "delivery-note-header": <FileText className="w-5 h-5" />,
  "delivery-note-items": <List className="w-5 h-5" />,
  "delivery-note-footer": <FileText className="w-5 h-5" />,
  "contract-header": <FileText className="w-5 h-5" />,
  "contract-body": <FileText className="w-5 h-5" />,
  "contract-signature": <FileText className="w-5 h-5" />,
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
      case "quote":
        return ["quote-header", "quote-items", "quote-footer"];
      case "estimate":
        return ["estimate-header", "estimate-items", "estimate-footer"];
      case "purchase-order":
        return [
          "purchase-order-header",
          "purchase-order-items",
          "purchase-order-footer",
        ];
      case "sales-order":
        return [
          "sales-order-header",
          "sales-order-items",
          "sales-order-footer",
        ];
      case "order-confirmation":
        return [
          "order-confirmation-header",
          "order-confirmation-items",
          "order-confirmation-footer",
        ];
      case "packing-slip":
        return [
          "packing-slip-header",
          "packing-slip-items",
          "packing-slip-footer",
        ];
      case "delivery-note":
        return [
          "delivery-note-header",
          "delivery-note-items",
          "delivery-note-footer",
        ];
      case "contract":
        return ["contract-header", "contract-body", "contract-signature"];
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

  // Get existing section types in the current template
  const existingSectionTypes = new Set(
    currentTemplate?.sections.map((s) => s.type) || [],
  );

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
            .map((component) => {
              const isAlreadyAdded = existingSectionTypes.has(component.type);
              return (
                <DraggableComponent
                  component={component}
                  isAlreadyAdded={isAlreadyAdded}
                  key={component.type}
                />
              );
            })}
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
          <section
            aria-label="Component palette"
            className="mt-4 overflow-y-auto h-[calc(100vh-8rem)]"
          >
            {paletteContent}
          </section>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <section
      aria-label="Component palette"
      className="h-[calc(100vh-4rem)] w-80 bg-muted/30 border-l border-border overflow-y-auto hidden md:block"
      data-testid="component-palette"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable regions must be keyboard accessible per WCAG 2.1.1
      tabIndex={0}
    >
      {paletteContent}
    </section>
  );
}

function DraggableComponent({
  component,
  isAlreadyAdded,
}: {
  component: ComponentDefinition;
  isAlreadyAdded: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    data: { type: component.type },
    disabled: isAlreadyAdded,
    id: `palette-${component.type}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...(isAlreadyAdded ? {} : { ...listeners, ...attributes })}
      className={`p-3 bg-background border-2 rounded-lg transition-all select-none ${
        isAlreadyAdded
          ? "opacity-60 border-muted cursor-not-allowed"
          : "cursor-grab hover:border-primary hover:shadow-md border-border"
      } ${isDragging ? "opacity-50 border-primary" : ""}`}
      data-testid={`palette-${component.type}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-primary mt-0.5">{iconMap[component.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{component.label}</h3>
            {isAlreadyAdded && (
              <Check className="h-4 w-4 text-green-600 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {component.configurableProperties.join(", ")}
          </p>
          {isAlreadyAdded && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              Already added
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

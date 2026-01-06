import type { DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { href, useNavigate, useParams } from "react-router";

import type { Route } from "../$templateId/+types/_index";
import { Button } from "~/components/ui/button";
import { ComponentPalette } from "~/features/builder/components/component-palette";
import { ExportButton } from "~/features/builder/components/export-button";
import { PreviewModal } from "~/features/builder/components/preview-modal";
import { PropertiesPanel } from "~/features/builder/components/properties-panel";
import { TemplateCanvas } from "~/features/builder/components/template-canvas";
import { useBuilderStore } from "~/features/builder/store/builder-store";
import { getTemplateById } from "~/features/builder/templates";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);
  const typedParams = params as {
    organizationSlug: string;
    templateId: string;
  };

  return {
    breadcrumb: {
      title: t("organizations:builder.breadcrumb"),
      to: href("/organizations/:organizationSlug/builder/:templateId", {
        organizationSlug: typedParams.organizationSlug,
        templateId: typedParams.templateId,
      }),
    },
    organizationSlug: typedParams.organizationSlug,
    pageTitle: getPageTitle(t, "organizations:builder.pageTitle"),
    templateId: typedParams.templateId,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function BuilderEditorRoute({
  loaderData,
}: Route.ComponentProps) {
  const params = useParams();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templateNotFound, setTemplateNotFound] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const {
    currentTemplate,
    setCurrentTemplate,
    selectSection,
    selectedSectionId,
  } = useBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // Use params directly to ensure we get the latest templateId from the URL
  const templateId = params.templateId;
  const organizationSlug =
    params.organizationSlug || loaderData.organizationSlug;

  // Load template on mount from predefined templates
  // Note: Database loading will be added in Phase 8 after schema is created
  useEffect(() => {
    if (!templateId) return;

    // Always reload template when templateId changes, even if store has a template
    // This ensures navigation between templates works correctly
    const template = getTemplateById(templateId);

    if (template) {
      // Create a copy for editing (with organization ID)
      const editableTemplate = {
        ...template,
        organizationId: organizationSlug || "", // Using slug as placeholder until Phase 8
      };
      setCurrentTemplate(editableTemplate);
      selectSection(null); // Reset selected section when loading new template
      setTemplateNotFound(false);
    } else {
      setTemplateNotFound(true);
    }
  }, [templateId, organizationSlug, setCurrentTemplate, selectSection]);

  if (templateNotFound) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The template with ID "{templateId}" could not be found.
          </p>
          <Button
            onClick={() => {
              navigate(`/organizations/${organizationSlug}/builder`);
            }}
            variant="outline"
          >
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  if (!currentTemplate) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  return (
    <DndContext onDragStart={handleDragStart} sensors={sensors}>
      <div className="flex flex-1 max-h-[calc(100vh-4rem)] overflow-hidden select-none">
        {/* Canvas on the left */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b p-4 flex items-center justify-between bg-background">
            <h2
              className="text-lg font-semibold"
              data-testid="template-editor-title"
            >
              {currentTemplate?.name || "Untitled Template"}
            </h2>
            <div className="flex gap-2">
              <Button
                data-testid="preview-button"
                onClick={() => setPreviewOpen(true)}
                variant="outline"
              >
                Preview
              </Button>
              <ExportButton />
            </div>
          </div>
          <TemplateCanvas />
        </div>

        {/* Side panel on the right - switches between ComponentPalette and PropertiesPanel */}
        {selectedSectionId ? <PropertiesPanel /> : <ComponentPalette />}

        <PreviewModal onOpenChange={setPreviewOpen} open={previewOpen} />
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="p-3 border-2 border-primary rounded-lg bg-background opacity-80 shadow-xl">
            <span className="font-medium text-sm">Dragging...</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

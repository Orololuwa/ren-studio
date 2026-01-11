import type { DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { data, href, useNavigate, useParams } from "react-router";
import { z } from "zod";

import type { Route } from "../$templateId/+types/_index";
import { Button } from "~/components/ui/button";
import {
  retrieveTemplateFromDatabaseById,
  saveTemplateToDatabase,
} from "~/features/builder/builder-model.server";
import { ComponentPalette } from "~/features/builder/components/component-palette";
import { ExportButton } from "~/features/builder/components/export-button";
import { PreviewModal } from "~/features/builder/components/preview-modal";
import { PropertiesPanel } from "~/features/builder/components/properties-panel";
import { TemplateCanvas } from "~/features/builder/components/template-canvas";
import { useBuilderStore } from "~/features/builder/store/builder-store";
import { getTemplateById } from "~/features/builder/templates";
import type { Template, TemplateSection } from "~/features/builder/types";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { createToastHeaders } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const saveTemplateSchema = z.object({
  globalStyles: z
    .union([z.record(z.string(), z.string()), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        return JSON.parse(val) as Record<string, string>;
      }
      return val;
    }),
  intent: z.literal("save"),
  name: z.string(),
  sections: z.union([z.array(z.any()), z.string()]).transform((val) => {
    if (typeof val === "string") {
      return JSON.parse(val) as unknown[];
    }
    return val;
  }),
  templateId: z.string().optional(),
  type: z.enum(["resume", "invoice", "certificate", "report-cards"]),
});

const actionSchema = saveTemplateSchema;

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization } = context.get(organizationMembershipContext);
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);
  const typedParams = params as {
    organizationSlug: string;
    templateId: string;
  };

  // Try to fetch from database first
  let template: Template | null = null;
  try {
    template = await retrieveTemplateFromDatabaseById({
      organizationId: organization.id,
      templateId: typedParams.templateId,
    });
  } catch {
    // If not found in database, fall back to predefined templates
  }

  // Fallback to predefined templates if not found in database
  if (!template) {
    template = getTemplateById(typedParams.templateId) || null;
  }

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
    template,
    templateId: typedParams.templateId,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);

  const result = await validateFormData(request, actionSchema);

  if (!result.success) {
    console.error("Validation failed:", result.response);
    return result.response;
  }

  const { data: body } = result;

  switch (body.intent) {
    case "save": {
      const template: Omit<Template, "createdAt" | "updatedAt"> = {
        globalStyles: body.globalStyles as Record<string, string>,
        id: body.templateId || "",
        name: body.name,
        organizationId: organization.id,
        sections: body.sections as TemplateSection[],
        type: body.type,
      };

      const savedTemplate = await saveTemplateToDatabase({
        organizationId: organization.id,
        template,
      });

      const toastHeaders = await createToastHeaders({
        description: "Your template has been saved successfully.",
        title: "Template saved",
      });

      return data(
        { success: true, template: savedTemplate },
        {
          headers: {
            ...Object.fromEntries(headers),
            ...Object.fromEntries(toastHeaders),
          },
        },
      );
    }
  }
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

  // Load template on mount from loader data (database or predefined)
  useEffect(() => {
    if (!templateId) return;

    // Use template from loader data
    const template = loaderData.template;

    if (template) {
      // Ensure organizationId is set correctly
      const editableTemplate = {
        ...template,
        organizationId: organizationSlug || "",
      };
      setCurrentTemplate(editableTemplate);
      selectSection(null); // Reset selected section when loading new template
      setTemplateNotFound(false);
    } else {
      setTemplateNotFound(true);
    }
  }, [
    templateId,
    organizationSlug,
    loaderData.template,
    setCurrentTemplate,
    selectSection,
  ]);

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

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  FileText,
  Receipt,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  data,
  href,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from "react-router";

import type { Route } from "./+types/_index";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  countTemplatesByOrganizationIdAndType,
  deleteTemplateFromDatabase,
  retrieveTemplatesByOrganizationIdAndType,
} from "~/features/builder/shared/builder-model.server";
import { TemplatePreviewThumbnail } from "~/features/builder/shared/components/template-preview-thumbnail";
import { getTemplatesByType } from "~/features/builder/shared/templates";
import type { Template } from "~/features/builder/shared/types";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { cn } from "~/lib/utils";
import { getPageTitle } from "~/utils/get-page-title.server";
import { createToastHeaders } from "~/utils/toast.server";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  const url = new URL(request.url);
  const typeParam = url.searchParams.get("type");
  const viewParam = url.searchParams.get("view");

  // Use defaults if parameters are missing
  const activeType = (typeParam || "resume") as BuilderType;
  const activeView = (viewParam || "defaults") as ViewTab;

  // Optimized fetching:
  // 1. Fetch counts for all types (efficient)
  let savedCounts: Partial<Record<BuilderType, number>> = {
    invoice: 0,
    receipt: 0,
    "report-cards": 0,
    resume: 0,
  };
  if (activeView === "saved") {
    savedCounts = {
      invoice: await countTemplatesByOrganizationIdAndType({
        organizationId: organization.id,
        type: "invoice",
      }),
      receipt: await countTemplatesByOrganizationIdAndType({
        organizationId: organization.id,
        type: "receipt",
      }),
      "report-cards": await countTemplatesByOrganizationIdAndType({
        organizationId: organization.id,
        type: "report-cards",
      }),
      resume: await countTemplatesByOrganizationIdAndType({
        organizationId: organization.id,
        type: "resume",
      }),
    };
  }

  // 2. Fetch full records ONLY for active type IF view is 'saved'
  let activeSavedTemplates: Template[] = [];
  if (activeView === "saved") {
    activeSavedTemplates = await retrieveTemplatesByOrganizationIdAndType({
      organizationId: organization.id,
      type: activeType,
    });
  }

  // 3. Get predefined templates (static)
  const defaultTemplates = getTemplatesByType(activeType);

  return data(
    {
      breadcrumb: {
        title: t("organizations:builder.breadcrumb"),
        to: href("/organizations/:organizationSlug/builder", {
          organizationSlug: params.organizationSlug,
        }),
      },
      activeType,
      activeView,
      defaultTemplates,
      organizationSlug: params.organizationSlug,
      pageTitle: getPageTitle(t, "organizations:builder.pageTitle"),
      savedCounts,
      savedTemplates: activeSavedTemplates,
    },
    { headers },
  );
}

export async function action({ request, context }: Route.ActionArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const templateId = formData.get("templateId") as string;

    if (!templateId) {
      return data(
        { success: false, error: "Template ID is required" },
        { status: 400, headers },
      );
    }

    const deleted = await deleteTemplateFromDatabase({
      organizationId: organization.id,
      templateId,
    });

    if (!deleted) {
      return data(
        { success: false, error: "Template not found" },
        { status: 404, headers },
      );
    }

    const toastHeaders = await createToastHeaders({
      description: "Your template has been deleted.",
      title: "Template deleted",
    });

    return data(
      { success: true },
      {
        headers: {
          ...Object.fromEntries(headers),
          ...Object.fromEntries(toastHeaders),
        },
      },
    );
  }

  return data({ success: false, error: "Unknown action" }, { status: 400 });
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

const builderTypes = [
  {
    icon: FileText,
    label: "Resume",
    value: "resume",
  },
  {
    icon: Receipt,
    label: "Invoice",
    value: "invoice",
  },
  {
    icon: ShoppingBag,
    label: "Receipt",
    value: "receipt",
  },
] as const;

const VALID_BUILDER_TYPES = [
  "resume",
  "invoice",
  "certificate",
  "report-cards",
  "quote",
  "proposal",
  "contract",
  "purchase-order",
  "receipt",
  "estimate",
  "statement",
  "letter",
  "form",
  "label",
] as const;
type BuilderType = (typeof VALID_BUILDER_TYPES)[number];

type ViewTab = "defaults" | "saved";

export default function BuilderRoute({ loaderData }: Route.ComponentProps) {
  const [, setSearchParams] = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(
    null,
  );
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const {
    activeType,
    activeView,
    defaultTemplates,
    organizationSlug,
    savedCounts,
    savedTemplates,
  } = loaderData;

  const handleTypeTabChange = (type: BuilderType) => {
    setSearchParams(
      (prev) => {
        prev.set("type", type);
        return prev;
      },
      { replace: true },
    );
  };

  const handleViewTabChange = (view: ViewTab) => {
    setSearchParams(
      (prev) => {
        prev.set("view", view);
        return prev;
      },
      { replace: true },
    );
  };

  const handleCreateNew = () => {
    // Navigate to create new template (empty template)
    navigate(`/organizations/${organizationSlug}/builder/new`);
  };

  const handleCustomize = (templateId: string, _isDefault: boolean) => {
    // Navigate to editor with template loaded
    // For defaults, use mode=customize to create a new copy
    // For saved, use mode=customize to create a new copy from saved template
    const url = `/organizations/${organizationSlug}/builder/${templateId}?mode=customize&source=${templateId}`;
    navigate(url);
  };

  const handleEdit = (templateId: string) => {
    // Navigate to editor with existing template for editing
    const url = `/organizations/${organizationSlug}/builder/${templateId}?mode=edit`;
    navigate(url);
  };

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    const formData = new FormData();
    formData.set("intent", "delete");
    formData.set("templateId", templateToDelete.id);

    // Use pathname to avoid query param issues
    await fetch(window.location.pathname, {
      method: "POST",
      body: formData,
    });

    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
    revalidator.revalidate();
  };

  const templates =
    activeView === "defaults" ? defaultTemplates : savedTemplates;

  const savedCount = savedCounts[activeType as keyof typeof savedCounts] || 0;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        {/* Builder Type Sidebar */}
        <aside
          className={cn(
            "border-r bg-sidebar flex flex-col shrink-0 transition-all duration-200 ease-linear",
            isCollapsed ? "w-12" : "w-64",
          )}
        >
          <div
            className={cn(
              "border-b flex items-center transition-all duration-200",
              isCollapsed ? "justify-center p-2" : "justify-between p-4",
            )}
          >
            {!isCollapsed && (
              <h2 className="text-lg font-semibold">Template Types</h2>
            )}
            <Button
              className={cn("h-7 w-7", isCollapsed && "mx-auto")}
              onClick={() => setIsCollapsed(!isCollapsed)}
              size="icon"
              variant="ghost"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </span>
            </Button>
          </div>
          <nav className="flex-1 p-2">
            <div className="space-y-1">
              {builderTypes.map((type) => {
                const Icon = type.icon;
                const button = (
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      activeType === type.value
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground",
                      isCollapsed && "justify-center px-2",
                    )}
                    data-testid={`tab-${type.value}`}
                    key={type.value}
                    onClick={() =>
                      handleTypeTabChange(type.value as BuilderType)
                    }
                    type="button"
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>{type.label}</span>}
                  </button>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={type.value}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right">{type.label}</TooltipContent>
                    </Tooltip>
                  );
                }

                return button;
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-2xl font-semibold"
                  data-testid="template-builder-heading"
                >
                  Template Builder
                </h1>
                <p
                  className="text-muted-foreground text-sm mt-1"
                  data-testid="template-builder-description"
                >
                  Choose a template and customize it to your needs
                </p>
              </div>
              <Button
                data-testid="create-new-button"
                onClick={handleCreateNew}
                size="lg"
              >
                Create New
              </Button>
            </div>

            {/* Defaults / Saved Tabs */}
            <Tabs
              onValueChange={(v) => handleViewTabChange(v as ViewTab)}
              value={activeView}
            >
              <TabsList>
                <TabsTrigger data-testid="tab-defaults" value="defaults">
                  Defaults
                </TabsTrigger>
                <TabsTrigger data-testid="tab-saved" value="saved">
                  Saved{savedCount > 0 && ` (${savedCount})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {templates.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-testid="no-templates-message"
              >
                <p>
                  {activeView === "defaults"
                    ? 'No default templates available. Click "Create New" to get started.'
                    : "No saved templates yet. Customize a default template to save it here."}
                </p>
              </div>
            ) : (
              <div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                data-testid="template-grid"
              >
                {templates
                  .filter((template) => template?.id && template.name)
                  .map((template) => (
                    <Card
                      className="flex flex-col"
                      data-testid={`template-card-${template.id}`}
                      key={template.id}
                    >
                      <CardHeader>
                        <TemplatePreviewThumbnail
                          organizationSlug={organizationSlug}
                          template={template}
                        />
                        <CardTitle
                          data-testid={`template-card-title-${template.id}`}
                        >
                          {template.name}
                        </CardTitle>
                        <CardDescription
                          data-testid={`template-card-description-${template.id}`}
                        >
                          {template.type
                            ? template.type.charAt(0).toUpperCase() +
                              template.type.slice(1)
                            : "Template"}{" "}
                          Template
                          {activeView === "saved" && template.updatedAt && (
                            <span className="block text-xs mt-1">
                              Last modified:{" "}
                              {new Date(
                                template.updatedAt,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1" />
                      <CardFooter className="gap-2">
                        {activeView === "saved" ? (
                          <>
                            <Button
                              className="flex-1"
                              data-testid={`template-edit-button-${template.id}`}
                              onClick={() => handleEdit(template.id)}
                              variant="default"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              className="flex-1"
                              data-testid={`template-customize-button-${template.id}`}
                              onClick={() =>
                                handleCustomize(template.id, false)
                              }
                              variant="outline"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </Button>
                            <Button
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              data-testid={`template-delete-button-${template.id}`}
                              onClick={() => handleDeleteClick(template)}
                              size="icon"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="w-full"
                            data-testid={`template-customize-button-${template.id}`}
                            onClick={() => handleCustomize(template.id, true)}
                            variant="outline"
                          >
                            Customize
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

import {
  Award,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { href, useNavigate, useSearchParams } from "react-router";

import type { Route } from "./+types/_index";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { retrieveTemplatesByOrganizationIdAndType } from "~/features/builder/shared/builder-model.server";
import { TemplatePreviewThumbnail } from "~/features/builder/shared/components/template-preview-thumbnail";
import { getTemplatesByType } from "~/features/builder/shared/templates";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { cn } from "~/lib/utils";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization } = context.get(organizationMembershipContext);
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  // Load templates from database
  const dbResume = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "resume",
  });
  const dbInvoice = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "invoice",
  });
  const dbCertificate = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "certificate",
  });
  const dbReportCards = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "report-cards",
  });
  const dbReceipt = await retrieveTemplatesByOrganizationIdAndType({
    organizationId: organization.id,
    type: "receipt",
  });

  // Load predefined templates
  const predefinedResume = getTemplatesByType("resume");
  const predefinedInvoice = getTemplatesByType("invoice");
  const predefinedCertificate = getTemplatesByType("certificate");
  const predefinedReportCards = getTemplatesByType("report-cards");
  const predefinedReceipt = getTemplatesByType("receipt");

  // Merge database templates with predefined templates
  // Database templates come first, then predefined templates
  const templatesByType = {
    certificate: [...dbCertificate, ...predefinedCertificate],
    invoice: [...dbInvoice, ...predefinedInvoice],
    receipt: [...dbReceipt, ...predefinedReceipt],
    "report-cards": [...dbReportCards, ...predefinedReportCards],
    resume: [...dbResume, ...predefinedResume],
  };

  return {
    breadcrumb: {
      title: t("organizations:builder.breadcrumb"),
      to: href("/organizations/:organizationSlug/builder", {
        organizationSlug: params.organizationSlug,
      }),
    },
    organizationSlug: params.organizationSlug,
    pageTitle: getPageTitle(t, "organizations:builder.pageTitle"),
    templatesByType,
  };
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
  {
    icon: Award,
    label: "Certificate",
    value: "certificate",
  },
  {
    icon: GraduationCap,
    label: "Report Cards",
    value: "report-cards",
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

function isValidBuilderType(type: string | null): type is BuilderType {
  return type !== null && VALID_BUILDER_TYPES.includes(type as BuilderType);
}

export default function BuilderRoute({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { templatesByType, organizationSlug } = loaderData;

  // Get active tab from URL param, default to "resume"
  const typeParam = searchParams.get("type");
  const activeTab = isValidBuilderType(typeParam) ? typeParam : "resume";

  // Set default type in URL if not present
  useEffect(() => {
    if (!typeParam || !isValidBuilderType(typeParam)) {
      setSearchParams({ type: "resume" }, { replace: true });
    }
  }, [typeParam, setSearchParams]);

  const handleTabChange = (type: BuilderType) => {
    setSearchParams({ type }, { replace: true });
  };

  const handleCreateNew = () => {
    // Navigate to create new template (empty template)
    navigate(`/organizations/${organizationSlug}/builder/new`);
  };

  const handleCustomize = (templateId: string) => {
    // Navigate to editor with template loaded, preserving search params
    const searchString = searchParams.toString();
    const url = `/organizations/${organizationSlug}/builder/${templateId}${
      searchString ? `?${searchString}` : ""
    }`;
    navigate(url);
  };

  const templates =
    templatesByType[activeTab as keyof typeof templatesByType] || [];

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
                      activeTab === type.value
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground",
                      isCollapsed && "justify-center px-2",
                    )}
                    data-testid={`tab-${type.value}`}
                    key={type.value}
                    onClick={() => handleTabChange(type.value as BuilderType)}
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

            {templates.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-testid="no-templates-message"
              >
                <p>
                  No templates available. Click "Create New" to get started.
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
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1" />
                      <CardFooter>
                        <Button
                          className="w-full"
                          data-testid={`template-customize-button-${template.id}`}
                          onClick={() => handleCustomize(template.id)}
                          variant="outline"
                        >
                          Customize
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

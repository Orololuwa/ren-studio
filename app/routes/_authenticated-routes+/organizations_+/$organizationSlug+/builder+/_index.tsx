import { useState } from "react";
import { href, useNavigate } from "react-router";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getTemplatesByType } from "~/features/builder/templates";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  // Load predefined templates only
  // Note: Database access will be added in Phase 8 after schema is created
  const predefinedResume = getTemplatesByType("resume");
  const predefinedInvoice = getTemplatesByType("invoice");
  const predefinedCertificate = getTemplatesByType("certificate");
  const predefinedReportCards = getTemplatesByType("report-cards");

  // Group templates by type (only predefined for now)
  const templatesByType = {
    certificate: predefinedCertificate,
    invoice: predefinedInvoice,
    "report-cards": predefinedReportCards,
    resume: predefinedResume,
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

export default function BuilderRoute({ loaderData }: Route.ComponentProps) {
  const [activeTab, setActiveTab] = useState<string>("resume");
  const navigate = useNavigate();
  const { templatesByType, organizationSlug } = loaderData;

  const handleCreateNew = () => {
    // Navigate to create new template (empty template)
    navigate(`/organizations/${organizationSlug}/builder/new`);
  };

  const handleCustomize = (templateId: string) => {
    // Navigate to editor with template loaded
    navigate(`/organizations/${organizationSlug}/builder/${templateId}`);
  };

  const templates =
    templatesByType[activeTab as keyof typeof templatesByType] || [];

  return (
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

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger data-testid="tab-resume" value="resume">
            Resume
          </TabsTrigger>
          <TabsTrigger data-testid="tab-invoice" value="invoice">
            Invoice
          </TabsTrigger>
          <TabsTrigger data-testid="tab-certificate" value="certificate">
            Certificate
          </TabsTrigger>
          <TabsTrigger data-testid="tab-report-cards" value="report-cards">
            Report Cards
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value={activeTab}>
          {templates.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-testid="no-templates-message"
            >
              <p>No templates available. Click "Create New" to get started.</p>
            </div>
          ) : (
            <div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              data-testid="template-grid"
            >
              {templates.map((template) => (
                <Card
                  className="flex flex-col"
                  data-testid={`template-card-${template.id}`}
                  key={template.id}
                >
                  <CardHeader>
                    <div className="bg-muted/50 aspect-4/3 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        {template.name} Preview
                      </span>
                    </div>
                    <CardTitle
                      data-testid={`template-card-title-${template.id}`}
                    >
                      {template.name}
                    </CardTitle>
                    <CardDescription
                      data-testid={`template-card-description-${template.id}`}
                    >
                      {template.type.charAt(0).toUpperCase() +
                        template.type.slice(1)}{" "}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

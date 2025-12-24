import { useState } from "react";
import { href } from "react-router";

import type { Route } from "./+types/builder";
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
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  return {
    breadcrumb: {
      title: t("organizations:builder.breadcrumb"),
      to: href("/organizations/:organizationSlug/builder", {
        organizationSlug: params.organizationSlug,
      }),
    },
    pageTitle: getPageTitle(t, "organizations:builder.pageTitle"),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

// Mock template data
const mockTemplates = {
  certificate: [
    {
      description: "Elegant certificate design",
      id: 1,
      name: "Achievement Certificate",
    },
    {
      description: "Professional completion template",
      id: 2,
      name: "Completion Certificate",
    },
    {
      description: "Formal award presentation",
      id: 3,
      name: "Award Certificate",
    },
  ],
  invoice: [
    {
      description: "Professional invoice template",
      id: 1,
      name: "Business Standard",
    },
    {
      description: "Contemporary design with clear sections",
      id: 2,
      name: "Modern Invoice",
    },
    {
      description: "Comprehensive template with itemization",
      id: 3,
      name: "Detailed Invoice",
    },
  ],
  "report-cards": [
    {
      description: "Comprehensive academic performance",
      id: 1,
      name: "Academic Report",
    },
    {
      description: "Student progress tracking",
      id: 2,
      name: "Progress Report",
    },
    {
      description: "Detailed semester evaluation",
      id: 3,
      name: "Semester Report",
    },
  ],
  resume: [
    {
      description: "Clean and contemporary design",
      id: 1,
      name: "Modern Professional",
    },
    {
      description: "Traditional layout with timeless appeal",
      id: 2,
      name: "Classic Elegant",
    },
    {
      description: "Bold design for creative professionals",
      id: 3,
      name: "Creative Portfolio",
    },
    { description: "Simple and focused layout", id: 4, name: "Minimalist" },
  ],
};

export default function BuilderRoute() {
  const [activeTab, setActiveTab] = useState<string>("resume");

  const handleCreateNew = () => {
    // TODO: Implement create new template functionality
    console.log("Create new template");
  };

  const handleCustomize = (templateId: number, templateType: string) => {
    // TODO: Implement customize template functionality
    console.log(`Customize template ${templateId} of type ${templateType}`);
  };

  const templates =
    mockTemplates[activeTab as keyof typeof mockTemplates] || [];

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Template Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Choose a template and customize it to your needs
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          Create New
        </Button>
      </div>

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
          <TabsTrigger value="report-cards">Report Cards</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value={activeTab}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card className="flex flex-col" key={template.id}>
                <CardHeader>
                  <div className="bg-muted/50 aspect-[4/3] rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">
                      {template.name} Preview
                    </span>
                  </div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1" />
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleCustomize(template.id, activeTab)}
                    variant="outline"
                  >
                    Customize
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

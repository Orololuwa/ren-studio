import { BotMessageSquare } from "lucide-react";
import { useState } from "react";
import { href } from "react-router";

import type { Route } from "./+types/jobs-and-clients";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { UrgentFunnelUpdates } from "~/features/funnel-updates/urgent-funnel-updates";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  // Dummy data for urgent funnel updates
  const urgentFunnelUpdates = [
    {
      candidateName: "Sarah Miller",
      deadline: "EOD",
      id: "1",
      isHigh: true,
      role: "Senior Product Manager",
      type: "offer_pending" as const,
    },
    {
      candidateName: "Michael Chen",
      deadline: "Tomorrow 5 PM",
      id: "2",
      isHigh: true,
      role: "Lead Software Engineer",
      type: "offer_pending" as const,
    },
    {
      candidateName: "Emily Rodriguez",
      deadline: "Friday EOD",
      id: "3",
      isHigh: false,
      role: "UX Designer",
      type: "response_needed" as const,
    },
    {
      candidateName: "David Thompson",
      deadline: "Monday 10 AM",
      id: "4",
      isHigh: true,
      role: "Data Scientist",
      type: "interview_scheduled" as const,
    },
  ];

  return {
    breadcrumb: {
      title: t("organizations:jobsAndClients.breadcrumb"),
      to: href("/organizations/:organizationSlug/jobs-and-clients", {
        organizationSlug: params.organizationSlug,
      }),
    },
    pageTitle: getPageTitle(t, "organizations:jobsAndClients.pageTitle"),
    urgentFunnelUpdates,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function JobsAndClientsRoute({
  loaderData,
}: Route.ComponentProps) {
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const { urgentFunnelUpdates } = loaderData;

  return (
    <div className="flex min-h-screen flex-1">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        {/* Mobile AI Assistant Trigger */}
        <div className="lg:hidden">
          <Sheet onOpenChange={setAiSheetOpen} open={aiSheetOpen}>
            <SheetTrigger asChild>
              <Button className="w-full gap-2" variant="outline">
                <BotMessageSquare className="size-4" />
                Open AI Assistant
              </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
              <SheetHeader className="border-b p-6">
                <SheetTitle>AI Assistant</SheetTitle>
                <SheetDescription>
                  Get help with your recruiting tasks
                </SheetDescription>
              </SheetHeader>
              <div> AI Assistant Panel</div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Urgent Funnel Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Urgent Funnel Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <UrgentFunnelUpdates updates={urgentFunnelUpdates} />
            </CardContent>
          </Card>

          {/* Daily Agenda */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Agenda</CardTitle>
            </CardHeader>
            <CardContent>...Daily Agenda Content...</CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>...Calendar View Content...</CardContent>
        </Card>
      </div>

      {/* AI Assistant Panel - Desktop Only */}
      <div className="bg-card text-card-foreground hidden w-80 shrink-0 border-l lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">AI Assistant</h2>
          </div>
          <div> AI Assistant Panel</div>
        </div>
      </div>
    </div>
  );
}

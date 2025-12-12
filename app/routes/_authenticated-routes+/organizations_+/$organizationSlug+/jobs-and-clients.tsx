import { addDays, format, subDays } from "date-fns";
import { BotMessageSquare, Clock } from "lucide-react";
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
import { AIAssistant } from "~/features/jobs-and-clients/ai-assistant/ai-assistant";
import { CalendarView } from "~/features/jobs-and-clients/calendar-view/calendar-view";
import { DailyAgenda } from "~/features/jobs-and-clients/daily-agenda/daily-agenda";
import { UrgentFunnelUpdates } from "~/features/jobs-and-clients/funnel-updates/urgent-funnel-updates";
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

  // Dummy data for daily agenda
  const dailyAgenda = [
    {
      completed: false,
      id: "1",
      title: "Review AI Candidate Profiles for Senior Software Engineer Role",
    },
    {
      completed: false,
      id: "2",
      title: "Schedule Interview with candidate 'Alex Johnson'",
    },
    {
      completed: true,
      id: "3",
      title: "Follow up on offer sent to Sarah Miller",
    },
    {
      completed: false,
      id: "4",
      title: "Prepare interview questions for Product Manager role",
    },
  ];

  const dailyAgendaDate = "2025.04.23";

  // Dummy data for calendar events
  // Events are keyed by date (yyyy-MM-dd format)
  const today = new Date();
  const todayString = format(today, "yyyy-MM-dd");
  const tomorrow = addDays(today, 1);
  const tomorrowString = format(tomorrow, "yyyy-MM-dd");
  const yesterday = subDays(today, 1);
  const yesterdayString = format(yesterday, "yyyy-MM-dd");

  const calendarEvents = [
    // Today's events
    {
      date: todayString,
      endTime: "10:00 AM",
      id: "1",
      startTime: "09:00 AM",
      title: "AI Candidate Screening",
    },
    {
      date: todayString,
      endTime: "11:30 AM",
      id: "2",
      startTime: "10:30 AM",
      title: "Team Sync: Q4 Agentic Features",
    },
    {
      date: todayString,
      endTime: "02:00 PM",
      id: "3",
      startTime: "01:00 PM",
      title: "Interview with Sarah Miller",
    },
    {
      date: todayString,
      endTime: "04:30 PM",
      id: "4",
      startTime: "03:30 PM",
      title: "Follow-up Call with Client",
    },
    // Tomorrow's events
    {
      date: tomorrowString,
      endTime: "09:30 AM",
      id: "5",
      startTime: "08:30 AM",
      title: "Morning Standup",
    },
    {
      date: tomorrowString,
      endTime: "12:00 PM",
      id: "6",
      startTime: "11:00 AM",
      title: "Client Presentation",
    },
    // Yesterday's events (for testing)
    {
      date: yesterdayString,
      endTime: "03:00 PM",
      id: "7",
      startTime: "02:00 PM",
      title: "Retrospective Meeting",
    },
  ];

  const currentDate = new Date();

  // Dummy data for AI Assistant
  const aiMessages = [
    {
      content: "Hello! I'm your AI Assistant. How can I help you today?",
      id: "1",
      role: "assistant" as const,
    },
    {
      content: "Show me candidates for the Senior Software Engineer role.",
      id: "2",
      role: "user" as const,
    },
    {
      content:
        "I've filtered the pipeline for Senior Software Engineer candidates. Alice Johnson is currently in the 'Applied' stage. Would you like me to summarize her profile?",
      id: "3",
      role: "assistant" as const,
    },
  ];

  const contextualActions = [
    {
      icon: "calendar" as const,
      id: "1",
      label: "Schedule Interview",
    },
    {
      icon: "file-text" as const,
      id: "2",
      label: "Summarize Candidate",
    },
    {
      icon: "mail" as const,
      id: "3",
      label: "Send To Marketplace",
    },
    {
      icon: "move-right" as const,
      id: "4",
      label: "Move to Next Stage",
    },
  ];

  return {
    aiMessages,
    breadcrumb: {
      title: t("organizations:jobsAndClients.breadcrumb"),
      to: href("/organizations/:organizationSlug/jobs-and-clients", {
        organizationSlug: params.organizationSlug,
      }),
    },
    calendarEvents,
    contextualActions,
    currentDate: currentDate.toISOString(),
    dailyAgenda,
    dailyAgendaDate,
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
  const [aiMessagesState, setAiMessagesState] = useState(loaderData.aiMessages);
  const {
    calendarEvents,
    contextualActions,
    currentDate,
    dailyAgenda,
    dailyAgendaDate,
    urgentFunnelUpdates,
  } = loaderData;

  const handleMessageAdd = (
    message: (typeof loaderData.aiMessages)[number],
  ) => {
    setAiMessagesState((prev) => [...prev, message]);
  };

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
            <SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-md">
              <SheetHeader className="border-b p-6 shrink-0">
                <SheetTitle>AI Assistant</SheetTitle>
                <SheetDescription>
                  Get help with your recruiting tasks
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 min-h-0">
                <AIAssistant
                  contextualActions={contextualActions}
                  messages={aiMessagesState}
                  onMessageAdd={handleMessageAdd}
                />
              </div>
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
              <div className="flex items-center justify-between">
                <CardTitle>
                  Daily Agenda {"//"} {dailyAgendaDate}
                </CardTitle>
                <Button size="icon" variant="ghost">
                  <Clock className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DailyAgenda items={dailyAgenda} />
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarView
              currentDate={new Date(currentDate)}
              events={calendarEvents}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Panel - Desktop Only */}
      <div className="bg-card text-card-foreground hidden h-screen w-80 shrink-0 border-l lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-6 shrink-0">
            <h2 className="text-xl font-semibold">AI Assistant</h2>
          </div>
          <div className="flex-1 min-h-0">
            <AIAssistant
              contextualActions={contextualActions}
              messages={aiMessagesState}
              onMessageAdd={handleMessageAdd}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

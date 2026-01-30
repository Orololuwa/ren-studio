import {
  ActivityIcon,
  FileTextIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { data, href, useLoaderData, useParams } from "react-router";

import type { Route } from "./+types/dashboard";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { ActivityFeedComponent } from "~/features/organizations/dashboard/activity-feed";
import { getDashboardData } from "~/features/organizations/dashboard/dashboard-helpers.server";
import { RecentTemplatesComponent } from "~/features/organizations/dashboard/recent-templates";
import { StatCardComponent } from "~/features/organizations/dashboard/stat-card";
import { TeamOverviewComponent } from "~/features/organizations/dashboard/team-overview";
import { TemplateStatsChartComponent } from "~/features/organizations/dashboard/template-stats-chart";
import { TemplateTypeChartComponent } from "~/features/organizations/dashboard/template-type-chart";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { organization, headers } = context.get(organizationMembershipContext);
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  const dashboardData = await getDashboardData(organization.id);

  return data(
    {
      breadcrumb: {
        title: t("organizations:dashboard.breadcrumb"),
        to: href("/organizations/:organizationSlug/dashboard", {
          organizationSlug: params.organizationSlug,
        }),
      },
      dashboardData,
      pageTitle: getPageTitle(t, "organizations:dashboard.pageTitle"),
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function OrganizationDashboardRoute() {
  const { dashboardData } = useLoaderData<typeof loader>();
  const params = useParams();
  const { t } = useTranslation("organizations", {
    keyPrefix: "dashboard",
  });

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
      {/* Stat Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardComponent
          description={t("stats.totalTemplates.description")}
          icon={FileTextIcon}
          title={t("stats.totalTemplates.title")}
          value={dashboardData.templates.total}
        />
        <StatCardComponent
          description={t("stats.teamMembers.description")}
          icon={UsersIcon}
          title={t("stats.teamMembers.title")}
          value={dashboardData.team.total}
        />
        <StatCardComponent
          description={t("stats.templatesThisMonth.description")}
          icon={TrendingUpIcon}
          title={t("stats.templatesThisMonth.title")}
          value={dashboardData.templates.thisMonth}
        />
        <StatCardComponent
          description={t("stats.recentActivity.description")}
          icon={ActivityIcon}
          title={t("stats.recentActivity.title")}
          value={dashboardData.activity.length}
        />
      </div>

      {/* Charts Section */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <TemplateStatsChartComponent data={dashboardData.templates.timeline} />
        <TemplateTypeChartComponent data={dashboardData.templates.byType} />
      </div>

      {/* Content Section */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RecentTemplatesComponent
          organizationSlug={params.organizationSlug ?? ""}
          templates={dashboardData.templates.recent}
        />
        <TeamOverviewComponent
          organizationSlug={params.organizationSlug ?? ""}
          team={dashboardData.team}
        />
        <ActivityFeedComponent activity={dashboardData.activity} />
      </div>
    </div>
  );
}

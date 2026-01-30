import { startOfMonth, subDays } from "date-fns";

import { prisma } from "~/utils/database.server";

export type DashboardData = {
  templates: {
    total: number;
    byType: { resume: number; invoice: number; receipt: number };
    recent: Array<{
      id: string;
      name: string;
      type: string;
      updatedAt: Date;
    }>;
    timeline: Array<{ date: string; count: number }>;
    thisMonth: number;
  };
  team: {
    total: number;
    byRole: { owner: number; admin: number; member: number };
    recent: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      joinedAt: Date;
    }>;
  };
  activity: Array<{
    id: string;
    type: "template_created" | "template_updated" | "member_added";
    user: string;
    description: string;
    timestamp: Date;
  }>;
};

/**
 * Gets template statistics for dashboard
 */
async function getTemplateStats(
  organizationId: string,
): Promise<DashboardData["templates"]> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const startOfCurrentMonth = startOfMonth(now);

  // Get total count
  const total = await prisma.template.count({
    where: { organizationId },
  });

  // Get counts by type
  const [resume, invoice, receipt] = await Promise.all([
    prisma.template.count({
      where: { organizationId, type: "resume" },
    }),
    prisma.template.count({
      where: { organizationId, type: "invoice" },
    }),
    prisma.template.count({
      where: { organizationId, type: "receipt" },
    }),
  ]);

  // Get templates created this month
  const thisMonth = await prisma.template.count({
    where: {
      organizationId,
      createdAt: { gte: startOfCurrentMonth },
    },
  });

  // Get recent templates
  const recentTemplates = await prisma.template.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      type: true,
      updatedAt: true,
    },
  });

  // Get template creation timeline (last 30 days)
  const templatesInRange = await prisma.template.findMany({
    where: {
      organizationId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
    },
  });

  // Group by date
  const timelineMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const date = subDays(now, i);
    const dateKey = date.toISOString().split("T")[0];
    if (dateKey) {
      timelineMap.set(dateKey, 0);
    }
  }

  templatesInRange.forEach((template) => {
    const dateKey = template.createdAt.toISOString().split("T")[0];
    if (dateKey) {
      const current = timelineMap.get(dateKey) ?? 0;
      timelineMap.set(dateKey, current + 1);
    }
  });

  const timeline = Array.from(timelineMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total,
    byType: { resume, invoice, receipt },
    recent: recentTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      updatedAt: t.updatedAt,
    })),
    timeline,
    thisMonth,
  };
}

/**
 * Gets team statistics for dashboard
 */
async function getTeamStats(
  organizationId: string,
): Promise<DashboardData["team"]> {
  // Get all active memberships
  const memberships = await prisma.organizationMembership.findMany({
    where: {
      organizationId,
      OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = memberships.length;

  // Count by role
  const byRole = {
    owner: memberships.filter((m) => m.role === "owner").length,
    admin: memberships.filter((m) => m.role === "admin").length,
    member: memberships.filter((m) => m.role === "member").length,
  };

  // Get recent members (last 5)
  const recent = memberships.slice(0, 5).map((membership) => ({
    id: membership.member.id,
    name: membership.member.name || "",
    email: membership.member.email,
    role: membership.role,
    joinedAt: membership.createdAt,
  }));

  return {
    total,
    byRole,
    recent,
  };
}

/**
 * Gets recent activity for dashboard
 */
async function getRecentActivity(
  organizationId: string,
): Promise<DashboardData["activity"]> {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  // Get recent templates (created or updated in last 7 days)
  const recentTemplates = await prisma.template.findMany({
    where: {
      organizationId,
      OR: [
        { createdAt: { gte: sevenDaysAgo } },
        { updatedAt: { gte: sevenDaysAgo } },
      ],
    },
    include: {
      organization: {
        select: {
          memberships: {
            where: {
              OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: now } }],
            },
            include: {
              member: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  // Get recent members (added in last 7 days)
  const recentMemberships = await prisma.organizationMembership.findMany({
    where: {
      organizationId,
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const activities: DashboardData["activity"] = [];

  // Add template activities
  recentTemplates.forEach((template) => {
    const isNew = template.createdAt >= sevenDaysAgo;
    const owner = template.organization.memberships[0]?.member;
    const userName = owner?.name || owner?.email || "Unknown";

    activities.push({
      id: `template-${template.id}-${isNew ? "created" : "updated"}`,
      type: isNew ? "template_created" : "template_updated",
      user: userName,
      description: isNew
        ? `Created template "${template.name}"`
        : `Updated template "${template.name}"`,
      timestamp: isNew ? template.createdAt : template.updatedAt,
    });
  });

  // Add member activities
  recentMemberships.forEach((membership) => {
    const userName = membership.member.name || membership.member.email;
    activities.push({
      id: `member-${membership.member.id}`,
      type: "member_added",
      user: userName,
      description: "joined the organization",
      timestamp: membership.createdAt,
    });
  });

  // Sort by timestamp descending and take top 10
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}

/**
 * Gets all dashboard data for an organization
 */
export async function getDashboardData(
  organizationId: string,
): Promise<DashboardData> {
  const [templates, team, activity] = await Promise.all([
    getTemplateStats(organizationId),
    getTeamStats(organizationId),
    getRecentActivity(organizationId),
  ]);

  return {
    templates,
    team,
    activity,
  };
}

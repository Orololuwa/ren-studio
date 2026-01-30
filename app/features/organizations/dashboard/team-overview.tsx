import { formatDistanceToNow } from "date-fns";
import { UsersIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { href, Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type TeamOverviewComponentProps = {
  organizationSlug: string;
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
};

export function TeamOverviewComponent({
  organizationSlug,
  team,
}: TeamOverviewComponentProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "dashboard.teamOverview",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{t("title")}</CardTitle>
        <CardDescription>
          {t("description", { count: team.total })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="mb-3 text-sm font-medium text-foreground">
              {t("roles.title")}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{team.byRole.owner}</p>
                <p className="text-muted-foreground text-xs">
                  {t("roles.owner")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{team.byRole.admin}</p>
                <p className="text-muted-foreground text-xs">
                  {t("roles.admin")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{team.byRole.member}</p>
                <p className="text-muted-foreground text-xs">
                  {t("roles.member")}
                </p>
              </div>
            </div>
          </div>

          {team.recent.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">
                {t("recent.title")}
              </h4>
              <div className="space-y-3">
                {team.recent.map((member) => (
                  <div
                    className="flex items-center justify-between"
                    key={member.id}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex size-8 items-center justify-center rounded-full">
                        <UsersIcon className="text-primary size-4" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.name || member.email}
                        </p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(member.joinedAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            className="text-primary hover:underline text-sm font-medium"
            to={href("/organizations/:organizationSlug/settings/members", {
              organizationSlug,
            })}
          >
            {t("viewAll")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

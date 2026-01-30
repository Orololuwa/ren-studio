import { formatDistanceToNow } from "date-fns";
import { FileTextIcon, PlusIcon, UserPlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type ActivityFeedComponentProps = {
  activity: Array<{
    id: string;
    type: "template_created" | "template_updated" | "member_added";
    user: string;
    description: string;
    timestamp: Date;
  }>;
};

const activityIcons = {
  template_created: FileTextIcon,
  template_updated: PlusIcon,
  member_added: UserPlusIcon,
};

export function ActivityFeedComponent({
  activity,
}: ActivityFeedComponentProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "dashboard.activityFeed",
  });

  if (activity.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">{t("title")}</CardTitle>
          <CardDescription>{t("empty")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.map((item) => {
            const Icon = activityIcons[item.type];

            return (
              <div className="flex items-start gap-3" key={item.id}>
                <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Icon className="text-primary size-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{item.user}</span>{" "}
                    {item.description}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

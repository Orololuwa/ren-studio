import { formatDistanceToNow } from "date-fns";
import { FileTextIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { href, Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type RecentTemplatesComponentProps = {
  organizationSlug: string;
  templates: Array<{
    id: string;
    name: string;
    type: string;
    updatedAt: Date;
  }>;
};

export function RecentTemplatesComponent({
  organizationSlug,
  templates,
}: RecentTemplatesComponentProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "dashboard.recentTemplates",
  });

  if (templates.length === 0) {
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
          {templates.map((template) => (
            <Link
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
              key={template.id}
              to={href(
                "/organizations/:organizationSlug/templates/:templateId",
                {
                  organizationSlug,
                  templateId: template.id,
                },
              )}
            >
              <div className="flex items-center gap-3">
                <FileTextIcon className="text-primary size-5" />
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-muted-foreground text-sm capitalize">
                    {template.type}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {formatDistanceToNow(template.updatedAt, { addSuffix: true })}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

type StatCardComponentProps = {
  description?: string;
  icon?: LucideIcon;
  title: string;
  trend?: ReactNode;
  value: ReactNode;
} & ComponentProps<typeof Card>;

export function StatCardComponent({
  className,
  description,
  icon: Icon,
  title,
  trend,
  value,
  ...props
}: StatCardComponentProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon aria-hidden="true" className="text-primary size-4" />}
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-primary">{value}</div>
          {trend && (
            <div className="text-xs text-muted-foreground">{trend}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Bell } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export type UrgentFunnelUpdate = {
  candidateName: string;
  deadline: string;
  id: string;
  isHigh: boolean;
  role: string;
  type: "offer_pending" | "interview_scheduled" | "response_needed";
};

type UrgentFunnelUpdatesProps = {
  updates: UrgentFunnelUpdate[];
};

export function UrgentFunnelUpdates({ updates }: UrgentFunnelUpdatesProps) {
  if (updates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No urgent funnel updates at this time.
      </p>
    );
  }

  return (
    <div className="max-h-[120px] space-y-4 overflow-y-auto">
      {updates.map((update) => (
        <div className="space-y-3" key={update.id}>
          <div className="flex items-start gap-3">
            <Bell className="text-muted-foreground mt-1 size-5 shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="font-medium">
                Offer Pending for {update.candidateName}
              </p>
              <p className="text-muted-foreground text-sm">
                Awaiting acceptance for the {update.role} role. Deadline:{" "}
                {update.deadline}.
              </p>
              <div className="flex flex-wrap gap-2">
                {update.isHigh && <Badge variant="destructive">High</Badge>}
                <Button size="sm" variant="outline">
                  Send Reminder
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

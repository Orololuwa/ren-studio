import { Clock } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";

export type DailyAgendaItem = {
  completed: boolean;
  id: string;
  title: string;
};

type DailyAgendaProps = {
  items: DailyAgendaItem[];
};

export function DailyAgenda({ items }: DailyAgendaProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set(items.filter((item) => item.completed).map((item) => item.id)),
  );

  const handleToggle = (id: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No agenda items for this day.
      </p>
    );
  }

  return (
    <div className="max-h-[120px] space-y-3 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent">
      {items.map((item) => (
        <div className="flex items-start gap-3" key={item.id}>
          <Checkbox
            checked={completedItems.has(item.id)}
            className="mt-0.5"
            id={item.id}
            onCheckedChange={() => handleToggle(item.id)}
          />
          <label
            className="flex-1 cursor-pointer text-sm leading-relaxed"
            htmlFor={item.id}
          >
            {item.title}
          </label>
          <Button size="icon" variant="ghost">
            <Clock className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

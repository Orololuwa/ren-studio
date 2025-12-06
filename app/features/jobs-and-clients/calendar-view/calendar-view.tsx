import { addDays, format, startOfDay, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

export type CalendarEvent = {
  date: string;
  endTime: string;
  id: string;
  startTime: string;
  title: string;
};

type CalendarViewProps = {
  currentDate: Date;
  events: CalendarEvent[];
  onDateChange?: (date: Date) => void;
};

function parseTimeToHour(timeString: string): number {
  const [time, period] = timeString.split(" ");
  if (!time || !period) return 0;
  const [hoursStr] = time.split(":");
  const hours = Number(hoursStr);
  if (Number.isNaN(hours)) return 0;
  if (period === "PM" && hours !== 12) {
    return hours + 12;
  }
  if (period === "AM" && hours === 12) {
    return 0;
  }
  return hours;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function generateTimeSlots(): number[] {
  // Generate all 24 hours
  const slots: number[] = [];
  for (let i = 0; i < 24; i++) {
    slots.push(i);
  }
  return slots;
}

function getEventsForTimeSlot(
  events: CalendarEvent[],
  hour: number,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStartHour = parseTimeToHour(event.startTime);
    return eventStartHour === hour;
  });
}

export function CalendarView({
  currentDate,
  events,
  onDateChange,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const isDatePickerActiveRef = useRef(false);
  const timeSlotsContainerRef = useRef<HTMLDivElement>(null);

  const currentHour = new Date().getHours();
  const timeSlots = generateTimeSlots();

  const isSelectedDateToday =
    format(startOfDay(selectedDate), "yyyy-MM-dd") ===
    format(startOfDay(currentDate), "yyyy-MM-dd");

  // Header date always shows full format
  const formattedDate = format(selectedDate, "EEEE, MMMM d");

  // Button text shows "Today" or short date format
  const buttonText = isSelectedDateToday
    ? "Today"
    : format(selectedDate, "MMM dd");

  // Filter events for the selected date
  const selectedDateString = format(selectedDate, "yyyy-MM-dd");
  const eventsForSelectedDate = events.filter(
    (event) => event.date === selectedDateString,
  );

  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleToday = () => {
    setSelectedDate(currentDate);
    onDateChange?.(currentDate);
    setIsDatePickerOpen(false);
  };

  // Scroll to current hour when viewing today (on mount or when date changes to today)
  useEffect(() => {
    if (
      isSelectedDateToday &&
      timeSlotsContainerRef.current &&
      currentHour >= 0 &&
      currentHour < 24
    ) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const currentHourElement = timeSlotsContainerRef.current?.querySelector(
          `[data-hour="${currentHour}"]`,
        );
        if (currentHourElement) {
          // Scroll to show current hour, centered in view
          currentHourElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isSelectedDateToday, currentHour]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 sm:w-[320px]">
          <Button
            aria-label="Previous day"
            onClick={handlePrevDay}
            size="icon"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h3 className="flex-1 text-center text-lg font-semibold">
            {formattedDate}
          </h3>
          <Button
            aria-label="Next day"
            onClick={handleNextDay}
            size="icon"
            variant="ghost"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Popover
          modal={false}
          onOpenChange={setIsDatePickerOpen}
          open={isDatePickerOpen}
        >
          <PopoverTrigger asChild>
            <Button variant={isSelectedDateToday ? "default" : "outline"}>
              {buttonText}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            onInteractOutside={(e) => {
              // Also prevent on interact outside for consistency
              if (isDatePickerActiveRef.current) {
                e.preventDefault();
                return;
              }
            }}
            onPointerDownOutside={(e) => {
              // Prevent closing when the date picker calendar is active
              // The native date picker calendar is rendered by the browser
              // in a separate layer, so clicks on it appear as outside clicks
              if (isDatePickerActiveRef.current) {
                e.preventDefault();
                return;
              }
              // Allow closing for other outside clicks
            }}
          >
            <div className="p-4">
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                max={format(currentDate, "yyyy-MM-dd")}
                min={format(subDays(currentDate, 365), "yyyy-MM-dd")}
                onBlur={() => {
                  // Longer delay to allow native calendar interactions
                  // The native date picker calendar opens after blur
                  setTimeout(() => {
                    // Check if input is still focused or if calendar is open
                    if (document.activeElement !== dateInputRef.current) {
                      isDatePickerActiveRef.current = false;
                    }
                  }, 500);
                }}
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate = new Date(e.target.value);
                    setSelectedDate(newDate);
                    onDateChange?.(newDate);
                    // Keep picker active briefly to allow calendar interactions
                    setTimeout(() => {
                      isDatePickerActiveRef.current = false;
                    }, 300);
                  }
                }}
                onFocus={() => {
                  // Mark date picker as active when input is focused
                  isDatePickerActiveRef.current = true;
                }}
                onMouseDown={(e) => {
                  // Keep active when clicking on the input
                  isDatePickerActiveRef.current = true;
                  e.stopPropagation();
                }}
                ref={dateInputRef}
                type="date"
                value={format(selectedDate, "yyyy-MM-dd")}
              />
              {!isSelectedDateToday && (
                <div className="mt-2 flex justify-end">
                  <Button onClick={handleToday} size="sm" variant="outline">
                    Go to Today
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[80px_1fr] gap-4 border-b pb-2 text-sm font-medium">
          <div className="text-muted-foreground">Time</div>
          <div>Event</div>
        </div>

        <div
          className="max-h-[320px] space-y-2 overflow-y-auto thin-scrollbar"
          ref={timeSlotsContainerRef}
        >
          {timeSlots.map((hour, index) => {
            const slotEvents = getEventsForTimeSlot(
              eventsForSelectedDate,
              hour,
            );
            const isLast = index === timeSlots.length - 1;

            return (
              <div
                className={`grid grid-cols-[80px_1fr] gap-4 ${isLast ? "py-3" : "border-b py-3"}`}
                data-hour={hour}
                key={hour}
              >
                <div className="text-muted-foreground text-sm">
                  {formatHour(hour)}
                </div>
                <div>
                  {slotEvents.length > 0 ? (
                    slotEvents.map((event) => (
                      <div
                        className="hover:bg-accent rounded-lg border p-3 transition-colors"
                        key={event.id}
                      >
                        <p className="font-medium">{event.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {event.startTime} - {event.endTime}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

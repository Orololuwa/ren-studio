import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
import { describe, expect, test, vi } from "vitest";

import type { CalendarEvent } from "./calendar-view";
import { CalendarView } from "./calendar-view";
import { createRoutesStub, render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createCalendarEvent: Factory<CalendarEvent> = ({
  date = format(new Date(), "yyyy-MM-dd"),
  endTime = "10:00 AM",
  id = createId(),
  startTime = "09:00 AM",
  title = faker.lorem.sentence(),
} = {}) => ({
  date,
  endTime,
  id,
  startTime,
  title,
});

describe("CalendarView", () => {
  test("given: empty events array, should: render time slots with no events", () => {
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualTimeHeader = screen.getByText(/time/i);
    const actualEventHeader = screen.getByText(/event/i);

    const expectedTimeHeader = expect(actualTimeHeader);
    const expectedEventHeader = expect(actualEventHeader);

    expectedTimeHeader.toBeInTheDocument();
    expectedEventHeader.toBeInTheDocument();
  });

  test("given: single event, should: render event in correct time slot", () => {
    const currentDate = new Date("2025-04-23T10:00:00");
    const event = createCalendarEvent({
      date: format(currentDate, "yyyy-MM-dd"),
      endTime: "10:00 AM",
      id: "1",
      startTime: "09:00 AM",
      title: "AI Candidate Screening",
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={[event]} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualTitle = screen.getByText(/ai candidate screening/i);
    const actualTime = screen.getByText(/09:00 AM - 10:00 AM/i);

    const expectedTitle = expect(actualTitle);
    const expectedTime = expect(actualTime);

    expectedTitle.toBeInTheDocument();
    expectedTime.toBeInTheDocument();
  });

  test("given: multiple events, should: render all events in correct time slots", () => {
    const currentDate = new Date("2025-04-23T10:00:00");
    const dateString = format(currentDate, "yyyy-MM-dd");
    const events = [
      createCalendarEvent({
        date: dateString,
        endTime: "10:00 AM",
        id: "1",
        startTime: "09:00 AM",
        title: "AI Candidate Screening",
      }),
      createCalendarEvent({
        date: dateString,
        endTime: "11:30 AM",
        id: "2",
        startTime: "10:30 AM",
        title: "Team Sync: Q4 Agentic Features",
      }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualEvent1 = screen.getByText(/ai candidate screening/i);
    const actualEvent2 = screen.getByText(/team sync: q4 agentic features/i);

    const expectedEvent1 = expect(actualEvent1);
    const expectedEvent2 = expect(actualEvent2);

    expectedEvent1.toBeInTheDocument();
    expectedEvent2.toBeInTheDocument();
  });

  test("given: component renders on today, should: display full formatted date in header", () => {
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByText(format(currentDate, "EEEE, MMMM d"));

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: selected date is not today, should: show short date format in button", async () => {
    const user = userEvent.setup();
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    // Navigate to next day
    const nextButton = screen.getByRole("button", { name: /next day/i });
    await user.click(nextButton);

    // Button should show short date format (MMM dd)
    const dateButton = screen.getByRole("button", {
      name: format(new Date("2025-04-24"), "MMM dd"),
    });
    expect(dateButton).toBeInTheDocument();

    // Header should still show full format
    const header = screen.getByText(
      format(new Date("2025-04-24"), "EEEE, MMMM d"),
    );
    expect(header).toBeInTheDocument();
  });

  test("given: events for different dates, should: only show events for selected date", () => {
    const currentDate = new Date("2025-04-23T10:00:00");
    const tomorrow = new Date("2025-04-24T10:00:00");
    const events = [
      createCalendarEvent({
        date: format(currentDate, "yyyy-MM-dd"),
        endTime: "10:00 AM",
        id: "1",
        startTime: "09:00 AM",
        title: "Today's Event",
      }),
      createCalendarEvent({
        date: format(tomorrow, "yyyy-MM-dd"),
        endTime: "11:00 AM",
        id: "2",
        startTime: "10:00 AM",
        title: "Tomorrow's Event",
      }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    // Should show today's event
    const todayEvent = screen.getByText(/today's event/i);
    expect(todayEvent).toBeInTheDocument();

    // Should not show tomorrow's event
    const tomorrowEvent = screen.queryByText(/tomorrow's event/i);
    expect(tomorrowEvent).not.toBeInTheDocument();
  });

  test("given: user clicks next day button, should: navigate to next day", async () => {
    const user = userEvent.setup();
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const nextButton = screen.getByRole("button", { name: /next day/i });
    await user.click(nextButton);

    // Header date should always show full format
    const actual = screen.getByText(
      format(new Date("2025-04-24"), "EEEE, MMMM d"),
    );

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: user clicks prev day button, should: navigate to previous day", async () => {
    const user = userEvent.setup();
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const prevButton = screen.getByRole("button", { name: /previous day/i });
    await user.click(prevButton);

    // Header date should always show full format
    const actual = screen.getByText(
      format(new Date("2025-04-22"), "EEEE, MMMM d"),
    );

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: user clicks Today button, should: open date picker popover", async () => {
    const user = userEvent.setup();
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const todayButton = screen.getByRole("button", { name: /today/i });
    await user.click(todayButton);

    const actual = screen.getByDisplayValue(format(currentDate, "yyyy-MM-dd"));

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: component renders, should: display all 24 time slots plus header", () => {
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    const { container } = render(<RouterStub />);

    const actual = container.querySelectorAll(
      '[class*="grid grid-cols-[80px_1fr]"]',
    );

    const expected = expect(actual);

    // 1 header + 24 time slots = 25 total
    expected.toHaveLength(25);
  });

  test("given: onDateChange callback provided, should: call callback when date changes", async () => {
    const user = userEvent.setup();
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const onDateChange = vi.fn();
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView
            currentDate={currentDate}
            events={events}
            onDateChange={onDateChange}
          />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const nextButton = screen.getByRole("button", { name: /next day/i });
    await user.click(nextButton);

    const actual = expect(onDateChange);

    actual.toHaveBeenCalledTimes(1);
  });

  test("given: selected date is today, should: show 'Today' button and hide 'Go to Today' button in popover", async () => {
    const user = userEvent.setup();
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const todayButton = screen.getByRole("button", { name: /^today$/i });
    expect(todayButton).toBeInTheDocument();

    await user.click(todayButton);

    const goToTodayButtons = screen.queryAllByRole("button", {
      name: /go to today/i,
    });
    expect(goToTodayButtons).toHaveLength(0);
  });

  test("given: selected date is not today, should: show short date in button and 'Go to Today' button in popover", async () => {
    const user = userEvent.setup();
    const currentDate = new Date("2025-04-23T10:00:00");
    const events: CalendarEvent[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <CalendarView currentDate={currentDate} events={events} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    // Navigate to next day
    const nextButton = screen.getByRole("button", { name: /next day/i });
    await user.click(nextButton);

    // Button should show short date format (not "Go to Today")
    const dateButton = screen.getByRole("button", {
      name: format(new Date("2025-04-24"), "MMM dd"),
    });
    expect(dateButton).toBeInTheDocument();

    await user.click(dateButton);

    // After opening popover, should have "Go to Today" button inside
    const goToTodayButton = screen.getByRole("button", {
      name: /go to today/i,
    });
    expect(goToTodayButton).toBeInTheDocument();
  });
});

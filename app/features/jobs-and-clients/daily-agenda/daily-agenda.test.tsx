import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, test } from "vitest";

import type { DailyAgendaItem } from "./daily-agenda";
import { DailyAgenda } from "./daily-agenda";
import { createRoutesStub, render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createAgendaItem: Factory<DailyAgendaItem> = ({
  id = createId(),
  title = faker.lorem.sentence(),
  completed = false,
} = {}) => ({
  completed,
  id,
  title,
});

describe("DailyAgenda", () => {
  test("given: empty items array, should: display empty state message", () => {
    const items: DailyAgendaItem[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => <DailyAgenda items={items} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByText(/no agenda items for this day/i);

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: single agenda item, should: render all required elements", () => {
    const item = createAgendaItem({
      completed: false,
      id: "1",
      title: "Review AI Candidate Profiles for Senior Software Engineer Role",
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => <DailyAgenda items={[item]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualTitle = screen.getByText(
      /review ai candidate profiles for senior software engineer role/i,
    );
    const actualCheckbox = screen.getByRole("checkbox", {
      name: item.title,
    });
    const actualClockButtons = screen.getAllByRole("button");

    const expectedTitle = expect(actualTitle);
    const expectedCheckbox = expect(actualCheckbox);
    const expectedClockButtons = expect(actualClockButtons);

    expectedTitle.toBeInTheDocument();
    expectedCheckbox.toBeInTheDocument();
    expect(actualCheckbox).not.toBeChecked();
    expectedClockButtons.toHaveLength(1);
  });

  test("given: agenda item with completed true, should: render checked checkbox", () => {
    const item = createAgendaItem({
      completed: true,
      id: "1",
      title: "Follow up on offer sent to Sarah Miller",
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => <DailyAgenda items={[item]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByRole("checkbox", { name: item.title });

    const expected = expect(actual);

    expected.toBeInTheDocument();
    expect(actual).toBeChecked();
  });

  test("given: agenda item with completed false, should: render unchecked checkbox", () => {
    const item = createAgendaItem({
      completed: false,
      id: "1",
      title: "Schedule Interview with candidate 'Alex Johnson'",
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => <DailyAgenda items={[item]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByRole("checkbox", { name: item.title });

    const expected = expect(actual);

    expected.toBeInTheDocument();
    expect(actual).not.toBeChecked();
  });

  test("given: multiple agenda items, should: render all items", () => {
    const items = [
      createAgendaItem({
        id: "1",
        title: "Review AI Candidate Profiles for Senior Software Engineer Role",
      }),
      createAgendaItem({
        id: "2",
        title: "Schedule Interview with candidate 'Alex Johnson'",
      }),
      createAgendaItem({
        id: "3",
        title: "Follow up on offer sent to Sarah Miller",
      }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => <DailyAgenda items={items} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualItem1 = screen.getByText(
      /review ai candidate profiles for senior software engineer role/i,
    );
    const actualItem2 = screen.getByText(
      /schedule interview with candidate 'alex johnson'/i,
    );
    const actualItem3 = screen.getByText(
      /follow up on offer sent to sarah miller/i,
    );
    const actualCheckboxes = screen.getAllByRole("checkbox");
    const actualClockButtons = screen.getAllByRole("button");

    const expectedItem1 = expect(actualItem1);
    const expectedItem2 = expect(actualItem2);
    const expectedItem3 = expect(actualItem3);
    const expectedCheckboxes = expect(actualCheckboxes);
    const expectedClockButtons = expect(actualClockButtons);

    expectedItem1.toBeInTheDocument();
    expectedItem2.toBeInTheDocument();
    expectedItem3.toBeInTheDocument();
    expectedCheckboxes.toHaveLength(3);
    expectedClockButtons.toHaveLength(3);
  });

  test("given: multiple items with mixed completion states, should: render checkboxes with correct states", () => {
    const items = [
      createAgendaItem({ completed: false, id: "1", title: "Task 1" }),
      createAgendaItem({ completed: true, id: "2", title: "Task 2" }),
      createAgendaItem({ completed: false, id: "3", title: "Task 3" }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => <DailyAgenda items={items} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualCheckbox1 = screen.getByRole("checkbox", { name: "Task 1" });
    const actualCheckbox2 = screen.getByRole("checkbox", { name: "Task 2" });
    const actualCheckbox3 = screen.getByRole("checkbox", { name: "Task 3" });

    const expectedCheckbox1 = expect(actualCheckbox1);
    const expectedCheckbox2 = expect(actualCheckbox2);
    const expectedCheckbox3 = expect(actualCheckbox3);

    expectedCheckbox1.not.toBeChecked();
    expectedCheckbox2.toBeChecked();
    expectedCheckbox3.not.toBeChecked();
  });

  test("given: multiple agenda items, should: render scrollable container with correct styling", () => {
    const items = [
      createAgendaItem({ id: "1" }),
      createAgendaItem({ id: "2" }),
      createAgendaItem({ id: "3" }),
      createAgendaItem({ id: "4" }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => <DailyAgenda items={items} />,
        path: "/",
      },
    ]);

    const { container } = render(<RouterStub />);

    const actual = container.querySelector("div.max-h-\\[120px\\]");

    const expected = expect(actual);

    expected.toBeInTheDocument();
    expect(actual).toHaveClass("max-h-[120px]");
    expect(actual).toHaveClass("overflow-y-auto");
  });

  test("given: agenda items, should: render clock icon buttons for each item", () => {
    const items = [
      createAgendaItem({ id: "1", title: "Task 1" }),
      createAgendaItem({ id: "2", title: "Task 2" }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => <DailyAgenda items={items} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getAllByRole("button");

    const expected = expect(actual);

    expected.toHaveLength(2);
  });
});

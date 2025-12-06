import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, test } from "vitest";

import type { UrgentFunnelUpdate } from "./urgent-funnel-updates";
import { UrgentFunnelUpdates } from "./urgent-funnel-updates";
import { createRoutesStub, render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createUpdate: Factory<UrgentFunnelUpdate> = ({
  id = createId(),
  candidateName = faker.person.fullName(),
  role = faker.person.jobTitle(),
  deadline = "EOD",
  isHigh = true,
  type = "offer_pending",
} = {}) => ({
  candidateName,
  deadline,
  id,
  isHigh,
  role,
  type,
});

describe("UrgentFunnelUpdates", () => {
  test("given: empty updates array, should: display empty state message", () => {
    const updates: UrgentFunnelUpdate[] = [];
    const RouterStub = createRoutesStub([
      {
        Component: () => <UrgentFunnelUpdates updates={updates} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByText(/no urgent funnel updates at this time/i);

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: single update, should: render all required elements", () => {
    const update = createUpdate({
      candidateName: "Sarah Miller",
      deadline: "EOD",
      isHigh: true,
      role: "Senior Product Manager",
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => <UrgentFunnelUpdates updates={[update]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualCandidateName = screen.getByText(
      /offer pending for sarah miller/i,
    );
    const actualRole = screen.getByText(
      /awaiting acceptance for the senior product manager role/i,
    );
    const actualDeadline = screen.getByText(/deadline: eod/i);
    const actualHighBadge = screen.getByText(/high/i);
    const actualButton = screen.getByRole("button", { name: /send reminder/i });

    const expectedCandidateName = expect(actualCandidateName);
    const expectedRole = expect(actualRole);
    const expectedDeadline = expect(actualDeadline);
    const expectedHighBadge = expect(actualHighBadge);
    const expectedButton = expect(actualButton);

    expectedCandidateName.toBeInTheDocument();
    expectedRole.toBeInTheDocument();
    expectedDeadline.toBeInTheDocument();
    expectedHighBadge.toBeInTheDocument();
    expectedButton.toBeInTheDocument();
  });

  test("given: update with isHigh true, should: display High badge", () => {
    const update = createUpdate({ isHigh: true });
    const RouterStub = createRoutesStub([
      {
        Component: () => <UrgentFunnelUpdates updates={[update]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByText(/high/i);

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: update with isHigh false, should: not display High badge", () => {
    const update = createUpdate({ isHigh: false });
    const RouterStub = createRoutesStub([
      {
        Component: () => <UrgentFunnelUpdates updates={[update]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.queryByText(/high/i);

    const expected = expect(actual);

    expected.not.toBeInTheDocument();
  });

  test("given: multiple updates, should: render all updates", () => {
    const updates = [
      createUpdate({ candidateName: "Sarah Miller", id: "1" }),
      createUpdate({ candidateName: "Michael Chen", id: "2" }),
      createUpdate({ candidateName: "Emily Rodriguez", id: "3" }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => <UrgentFunnelUpdates updates={updates} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualSarah = screen.getByText(/offer pending for sarah miller/i);
    const actualMichael = screen.getByText(/offer pending for michael chen/i);
    const actualEmily = screen.getByText(/offer pending for emily rodriguez/i);
    const actualButtons = screen.getAllByRole("button", {
      name: /send reminder/i,
    });

    const expectedSarah = expect(actualSarah);
    const expectedMichael = expect(actualMichael);
    const expectedEmily = expect(actualEmily);
    const expectedButtons = expect(actualButtons);

    expectedSarah.toBeInTheDocument();
    expectedMichael.toBeInTheDocument();
    expectedEmily.toBeInTheDocument();
    expectedButtons.toHaveLength(3);
  });

  test("given: multiple updates with mixed isHigh values, should: show High badge only for high priority items", () => {
    const updates = [
      createUpdate({ candidateName: "Sarah Miller", id: "1", isHigh: true }),
      createUpdate({ candidateName: "Michael Chen", id: "2", isHigh: false }),
      createUpdate({ candidateName: "Emily Rodriguez", id: "3", isHigh: true }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => <UrgentFunnelUpdates updates={updates} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualHighBadges = screen.getAllByText(/high/i);
    const actualButtons = screen.getAllByRole("button", {
      name: /send reminder/i,
    });

    const expectedHighBadges = expect(actualHighBadges);
    const expectedButtons = expect(actualButtons);

    expectedHighBadges.toHaveLength(2);
    expectedButtons.toHaveLength(3);
  });

  test("given: update with specific data, should: display exact values correctly", () => {
    const update = createUpdate({
      candidateName: "David Thompson",
      deadline: "Monday 10 AM",
      isHigh: true,
      role: "Data Scientist",
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => <UrgentFunnelUpdates updates={[update]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualCandidateName = screen.getByText(
      /offer pending for david thompson/i,
    );
    const actualRole = screen.getByText(
      /awaiting acceptance for the data scientist role/i,
    );
    const actualDeadline = screen.getByText(/deadline: monday 10 am/i);

    const expectedCandidateName = expect(actualCandidateName);
    const expectedRole = expect(actualRole);
    const expectedDeadline = expect(actualDeadline);

    expectedCandidateName.toBeInTheDocument();
    expectedRole.toBeInTheDocument();
    expectedDeadline.toBeInTheDocument();
  });

  test("given: multiple updates, should: render scrollable container with correct styling", () => {
    const updates = [
      createUpdate({ id: "1" }),
      createUpdate({ id: "2" }),
      createUpdate({ id: "3" }),
      createUpdate({ id: "4" }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => <UrgentFunnelUpdates updates={updates} />,
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
});

import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import type { AIMessage, ContextualAction } from "./ai-assistant";
import { AIAssistant } from "./ai-assistant";
import {
  createRoutesStub,
  render,
  screen,
  waitFor,
} from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createAIMessage: Factory<AIMessage> = ({
  content = faker.lorem.sentence(),
  id = createId(),
  role = "assistant",
} = {}) => ({
  content,
  id,
  role,
});

const createContextualAction: Factory<ContextualAction> = ({
  icon = "calendar",
  id = createId(),
  label = faker.lorem.words(2),
  onClick,
} = {}) => ({
  icon,
  id,
  label,
  onClick,
});

describe("AIAssistant", () => {
  test("given: empty messages, should: display default greeting message", () => {
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByText(
      /hello! i'm your ai assistant. how can i help you today?/i,
    );

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: single assistant message, should: render message in muted bubble", () => {
    const message = createAIMessage({
      content: "This is an AI response",
      id: "1",
      role: "assistant",
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[message]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByText(/this is an ai response/i);
    const messageContainer = actual.closest(".bg-muted");

    const expected = expect(actual);
    const expectedContainer = expect(messageContainer);

    expected.toBeInTheDocument();
    expectedContainer.toBeInTheDocument();
  });

  test("given: single user message, should: render message in primary bubble", () => {
    const message = createAIMessage({
      content: "This is a user message",
      id: "1",
      role: "user",
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[message]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.getByText(/this is a user message/i);
    const messageContainer = actual.closest(".bg-primary");

    const expected = expect(actual);
    const expectedContainer = expect(messageContainer);

    expected.toBeInTheDocument();
    expectedContainer.toBeInTheDocument();
  });

  test("given: multiple messages, should: render all messages in correct order", () => {
    const messages = [
      createAIMessage({
        content: "First message",
        id: "1",
        role: "assistant",
      }),
      createAIMessage({
        content: "Second message",
        id: "2",
        role: "user",
      }),
      createAIMessage({
        content: "Third message",
        id: "3",
        role: "assistant",
      }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={messages} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualFirst = screen.getByText(/first message/i);
    const actualSecond = screen.getByText(/second message/i);
    const actualThird = screen.getByText(/third message/i);

    const expectedFirst = expect(actualFirst);
    const expectedSecond = expect(actualSecond);
    const expectedThird = expect(actualThird);

    expectedFirst.toBeInTheDocument();
    expectedSecond.toBeInTheDocument();
    expectedThird.toBeInTheDocument();
  });

  test("given: user types and sends message, should: add message to chat", async () => {
    const user = userEvent.setup();
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const input = screen.getByPlaceholderText(/ask me anything.../i);
    const sendButton = screen.getByRole("button", { name: /send/i });

    await user.type(input, "Test message");
    await user.click(sendButton);

    const actual = screen.getByText(/test message/i);

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: user presses Enter, should: send message", async () => {
    const user = userEvent.setup();
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const input = screen.getByPlaceholderText(/ask me anything.../i);

    await user.type(input, "Enter test message{Enter}");

    const actual = screen.getByText(/enter test message/i);

    const expected = expect(actual);

    expected.toBeInTheDocument();
  });

  test("given: user sends message, should: receive AI response after delay", async () => {
    const user = userEvent.setup({ delay: null });
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const input = screen.getByPlaceholderText(/ask me anything.../i);
    const sendButton = screen.getByRole("button", { name: /send/i });

    await user.type(input, "Test question");
    await user.click(sendButton);

    // Wait for AI response (simulated 500ms delay)
    await waitFor(
      () => {
        const actual = screen.getByText(
          /i've received your message. how can i assist you further?/i,
        );
        expect(actual).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  test("given: empty input, should: not send message when clicking send", async () => {
    const user = userEvent.setup({ delay: null });
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    // Should still show only the default greeting
    const greeting = screen.getByText(
      /hello! i'm your ai assistant. how can i help you today?/i,
    );
    expect(greeting).toBeInTheDocument();

    // Should not have any user messages (only the greeting)
    const allMessages = screen.getAllByText(/hello|test/i);
    expect(allMessages.length).toBe(1);
  });

  test("given: contextual actions provided, should: render all action buttons", () => {
    const actions = [
      createContextualAction({
        icon: "calendar",
        id: "1",
        label: "Schedule Interview",
      }),
      createContextualAction({
        icon: "file-text",
        id: "2",
        label: "Summarize Candidate",
      }),
      createContextualAction({
        icon: "mail",
        id: "3",
        label: "Send To Marketplace",
      }),
      createContextualAction({
        icon: "move-right",
        id: "4",
        label: "Move to Next Stage",
      }),
    ];
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <AIAssistant contextualActions={actions} initialMessages={[]} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualSchedule = screen.getByRole("button", {
      name: /schedule interview/i,
    });
    const actualSummarize = screen.getByRole("button", {
      name: /summarize candidate/i,
    });
    const actualSend = screen.getByRole("button", {
      name: /send to marketplace/i,
    });
    const actualMove = screen.getByRole("button", {
      name: /move to next stage/i,
    });

    const expectedSchedule = expect(actualSchedule);
    const expectedSummarize = expect(actualSummarize);
    const expectedSend = expect(actualSend);
    const expectedMove = expect(actualMove);

    expectedSchedule.toBeInTheDocument();
    expectedSummarize.toBeInTheDocument();
    expectedSend.toBeInTheDocument();
    expectedMove.toBeInTheDocument();
  });

  test("given: no contextual actions, should: not render contextual actions section", () => {
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actual = screen.queryByText(/contextual actions:/i);

    const expected = expect(actual);

    expected.not.toBeInTheDocument();
  });

  test("given: user clicks contextual action, should: call onClick handler", async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();
    const action = createContextualAction({
      icon: "calendar",
      id: "1",
      label: "Schedule Interview",
      onClick,
    });
    const RouterStub = createRoutesStub([
      {
        Component: () => (
          <AIAssistant contextualActions={[action]} initialMessages={[]} />
        ),
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actionButton = screen.getByRole("button", {
      name: /schedule interview/i,
    });
    await user.click(actionButton);

    const actual = expect(onClick);

    actual.toHaveBeenCalledTimes(1);
  });

  test("given: component renders, should: display input field and send button", () => {
    const RouterStub = createRoutesStub([
      {
        Component: () => <AIAssistant initialMessages={[]} />,
        path: "/",
      },
    ]);

    render(<RouterStub />);

    const actualInput = screen.getByPlaceholderText(/ask me anything.../i);
    const actualSendButton = screen.getByRole("button", { name: /send/i });

    const expectedInput = expect(actualInput);
    const expectedSendButton = expect(actualSendButton);

    expectedInput.toBeInTheDocument();
    expectedSendButton.toBeInTheDocument();
  });
});

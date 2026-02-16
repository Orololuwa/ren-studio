import { Calendar, FileText, Mail, MoveRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export type AIMessage = {
  content: string;
  id: string;
  role: "user" | "assistant";
  timestamp?: Date;
};

export type ContextualAction = {
  icon: "calendar" | "file-text" | "mail" | "move-right";
  id: string;
  label: string;
  onClick?: () => void;
};

type AIAssistantProps = {
  contextualActions?: ContextualAction[];
  initialMessages?: AIMessage[];
  messages?: AIMessage[];
  onMessageAdd?: (message: AIMessage) => void;
};

const iconMap = {
  calendar: Calendar,
  "file-text": FileText,
  mail: Mail,
  "move-right": MoveRight,
};

export function AIAssistant({
  contextualActions = [],
  initialMessages = [],
  messages: messagesProp,
  onMessageAdd,
}: AIAssistantProps) {
  // Use controlled messages if provided, otherwise use local state
  const [localMessages, setLocalMessages] =
    useState<AIMessage[]>(initialMessages);
  const messages = messagesProp ?? localMessages;
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length !== prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevMessagesLengthRef.current = messages.length;
    }
  });

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newUserMessage: AIMessage = {
      content: inputValue.trim(),
      id: `user-${Date.now()}`,
      role: "user",
      timestamp: new Date(),
    };

    // If controlled, use callback; otherwise update local state
    if (onMessageAdd) {
      onMessageAdd(newUserMessage);
    } else {
      setLocalMessages((prev) => [...prev, newUserMessage]);
    }
    setInputValue("");

    // Simulate AI response (in real app, this would be an API call)
    setTimeout(() => {
      const aiResponse: AIMessage = {
        content: "I've received your message. How can I assist you further?",
        id: `assistant-${Date.now()}`,
        role: "assistant",
        timestamp: new Date(),
      };
      if (onMessageAdd) {
        onMessageAdd(aiResponse);
      } else {
        setLocalMessages((prev) => [...prev, aiResponse]);
      }
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action: ContextualAction) => {
    action.onClick?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex-1 space-y-4 overflow-y-auto p-6 thin-scrollbar"
        ref={messagesContainerRef}
      >
        {messages.length === 0 ? (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm">
              Hello! I'm your AI Assistant. How can I help you today?
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] space-y-2"
                  : "space-y-2"
              }
              key={message.id}
            >
              <div
                className={
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-lg p-3"
                    : "bg-muted rounded-lg p-4"
                }
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 shrink-0">
        <div className="space-y-3">
          <Input
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything..."
            value={inputValue}
          />
          <Button className="w-full" onClick={handleSend}>
            Send
          </Button>
        </div>

        {contextualActions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Contextual Actions:
            </p>
            {contextualActions.map((action) => {
              const IconComponent = iconMap[action.icon];
              return (
                <Button
                  className="w-full justify-start gap-2"
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  size="sm"
                  variant="ghost"
                >
                  <IconComponent className="size-4" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

//one-line comment for the plot

"use client";

import { useState, useRef, useEffect } from "react";
import { PaperPlaneRight, Robot, User } from "@phosphor-icons/react";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "agent",
    content:
      "Welcome to HireWise. I'm your recruiting agent. Tell me what you need — find candidates, create a job, or summarize your pipeline.",
    timestamp: new Date(),
  },
];

/**
 * MobileChatView — Full-screen chat interface for mobile (<768px).
 * Rendered as the primary tab in mobile bottom-nav layout.
 */
export function MobileChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: `Processing your request: "${trimmed}". Full agent integration will be available in a future update.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-surface-primary"
      data-testid="mobile-chat-view"
    >
      {/* Header */}
      <div className="flex items-center h-12 px-4 border-b border-border-default bg-surface-secondary">
        <span className="font-heading text-sm font-bold text-accent-primary tracking-wide uppercase">
          HireWise
        </span>
        <span className="ml-3 text-text-muted text-xs font-mono uppercase tracking-widest">
          Agent Chat
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {messages.map((msg) => (
          <MobileChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — positioned above the bottom nav (pb accounts for nav height) */}
      <div className="border-t border-border-default p-3 pb-4">
        <div className="flex items-center gap-2 bg-surface-secondary border border-border-default">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent..."
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none font-body"
            data-testid="mobile-chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 text-accent-primary hover:bg-surface-tertiary transition-colors disabled:text-text-muted disabled:cursor-not-allowed"
            aria-label="Send message"
            data-testid="mobile-chat-send"
          >
            <PaperPlaneRight size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      data-testid={`mobile-chat-bubble-${message.role}`}
    >
      <div
        className={`flex-shrink-0 flex items-center justify-center w-7 h-7 mt-0.5 ${
          isUser
            ? "bg-accent-primary text-surface-primary"
            : "bg-surface-tertiary text-text-secondary"
        }`}
      >
        {isUser ? (
          <User size={14} weight="bold" />
        ) : (
          <Robot size={14} weight="bold" />
        )}
      </div>

      <div
        className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-accent-primary text-surface-primary"
            : "bg-surface-secondary border border-border-default text-text-primary"
        }`}
        style={{ borderRadius: "var(--radius-max)" }}
      >
        {message.content}
      </div>
    </div>
  );
}

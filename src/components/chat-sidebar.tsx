"use client";

import { useState, useRef, useEffect } from "react";
import {
  List,
  ChatCircleDots,
  PaperPlaneRight,
  Robot,
  User,
} from "@phosphor-icons/react";
import { useSidebarStore } from "@/stores/sidebar-store";

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
 * ChatSidebar — Persistent chat sidebar with expand/collapse.
 * Desktop: full sidebar or icon strip.
 * This component handles only the sidebar UI; layout decisions are in AppShell.
 */
export function ChatSidebar() {
  const { isExpanded, toggle } = useSidebarStore();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
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

    // Simulate agent response after a short delay
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

  // Collapsed icon-strip view
  if (!isExpanded) {
    return (
      <aside
        className="flex flex-col flex-shrink-0 border-r border-border-default bg-surface-secondary"
        style={{ width: "var(--sidebar-collapsed-width)" }}
        data-testid="chat-sidebar-collapsed"
      >
        {/* Collapse toggle */}
        <div className="flex items-center justify-center h-12 border-b border-border-default">
          <button
            onClick={toggle}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Expand sidebar"
            data-testid="sidebar-toggle"
          >
            <List size={20} weight="bold" />
          </button>
        </div>

        {/* Icon strip */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={toggle}
            className="p-2 text-text-secondary hover:text-accent-primary transition-colors"
            aria-label="Open chat"
            data-testid="sidebar-chat-icon"
          >
            <ChatCircleDots size={22} weight="bold" />
          </button>
        </div>
      </aside>
    );
  }

  // Expanded sidebar view
  return (
    <aside
      className="flex flex-col flex-shrink-0 border-r border-border-default bg-surface-secondary"
      style={{ width: "var(--sidebar-width)" }}
      data-testid="chat-sidebar-expanded"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border-default">
        <span className="font-heading text-sm font-bold text-accent-primary tracking-wide uppercase">
          HireWise
        </span>
        <button
          onClick={toggle}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          aria-label="Collapse sidebar"
          data-testid="sidebar-toggle"
        >
          <List size={20} weight="bold" />
        </button>
      </div>

      {/* Chat label */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-text-muted text-xs font-mono uppercase tracking-widest">
          Agent Chat
        </p>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2"
        data-testid="chat-messages"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border-default p-3">
        <div className="flex items-center gap-2 bg-surface-primary border border-border-default">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent..."
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none font-body"
            data-testid="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 text-accent-primary hover:bg-surface-tertiary transition-colors disabled:text-text-muted disabled:cursor-not-allowed"
            aria-label="Send message"
            data-testid="chat-send"
          >
            <PaperPlaneRight size={18} weight="bold" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/**
 * ChatBubble — Single message in the chat thread.
 * User messages: #D4FF00 bg, #0D0D0D text, rectangular.
 * Agent messages: #1A1A1A bg, default text, rectangular.
 */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      data-testid={`chat-bubble-${message.role}`}
    >
      {/* Avatar */}
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

      {/* Message bubble — rectangular, no speech-bubble tails, max border-radius 4px */}
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

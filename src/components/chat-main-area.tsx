"use client";

import { useState, useRef, useEffect } from "react";
import { PaperPlaneRight, Lightning } from "@phosphor-icons/react";
import { ChatBubble, ProgressIndicator, ActionCard, JDPreviewCard, useChat } from "@/components/chat";

/**
 * ChatMainArea — The primary AI conversation surface (center of the layout).
 *
 * Occupies ~60-65% of the viewport width on desktop. Contains:
 * - Conversation flow (chat bubbles, progress indicators, action cards)
 * - Input bar fixed at the bottom
 * - Empty state with welcome message and quick-command suggestions
 *
 * Design: surface-primary (#0D0D0D) background, conversation centered
 * with max-width ~800px.
 */

const QUICK_COMMANDS = [
  { label: "Create a new job", prompt: "I need to hire a senior Go backend engineer in Berlin, 5+ years experience, must know Kubernetes" },
  { label: "Find senior engineers", prompt: "Find me 50 senior backend engineers with Go + Kubernetes experience" },
  { label: "Search designers", prompt: "Search for product designers with Figma and design systems experience" },
];

export function ChatMainArea() {
  const { messages, handleSend, handleJDConfirm, handleJDModify } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    handleSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleQuickCommand = (prompt: string) => {
    handleSend(prompt);
  };

  const showEmptyState = messages.length <= 1; // Only welcome message

  return (
    <div
      className="flex-1 flex flex-col min-w-0 bg-surface-primary"
      data-testid="chat-main-area"
    >
      {/* Header */}
      <header className="flex-shrink-0 flex items-center h-12 px-6 border-b border-border-default bg-surface-primary">
        <span className="font-heading text-sm font-bold text-accent-primary tracking-wide uppercase">
          HireWise
        </span>
        <span className="ml-3 text-text-muted text-xs font-mono uppercase tracking-widest">
          AI Agent
        </span>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto" data-testid="chat-messages">
        <div className="max-w-[800px] mx-auto px-4 py-4 flex flex-col gap-3">
          {messages.map((msg) =>
            msg.type === "progress" && msg.progress ? (
              <ProgressIndicator key={msg.id} progress={msg.progress} />
            ) : msg.type === "action-card" && msg.actionCard ? (
              <ActionCard key={msg.id} data={msg.actionCard} />
            ) : msg.type === "jd-preview" && msg.jdPreview ? (
              <JDPreviewCard
                key={msg.id}
                data={msg.jdPreview}
                onConfirm={handleJDConfirm}
                onModify={handleJDModify}
              />
            ) : (
              <ChatBubble key={msg.id} message={msg} />
            ),
          )}

          {/* Quick command suggestions — shown only in empty state */}
          {showEmptyState && (
            <div className="mt-8" data-testid="quick-commands">
              <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
                Quick actions
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.label}
                    onClick={() => handleQuickCommand(cmd.prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-text-secondary border border-border-default bg-surface-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                    data-testid={`quick-cmd-${cmd.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Lightning size={12} weight="bold" />
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area — fixed bottom, surface-secondary background */}
      <div className="flex-shrink-0 border-t border-border-default bg-surface-secondary p-3">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 bg-surface-primary border border-border-default">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me what you need — find candidates, create a job, or manage your pipeline..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none font-body"
              data-testid="chat-input"
            />
            <button
              onClick={onSend}
              disabled={!input.trim()}
              className="p-3 text-accent-primary hover:bg-surface-tertiary transition-colors disabled:text-text-muted disabled:cursor-not-allowed"
              aria-label="Send message"
              data-testid="chat-send"
            >
              <PaperPlaneRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { ChatBubble, ProgressIndicator, ActionCard, JDPreviewCard, QuickCommandChips, useChat } from "@/components/chat";

/**
 * ChatMainArea — The primary AI conversation surface (center of the layout).
 *
 * Occupies ~60-65% of the viewport width on desktop. Contains:
 * - Conversation flow (chat bubbles, progress indicators, action cards)
 * - Input bar fixed at the bottom
 * - Contextual quick-command suggestion chips (NAV-1)
 *
 * Design: surface-primary (#0D0D0D) background, conversation centered
 * with max-width ~800px.
 */

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

  /** Pre-fill input with the chip's prompt text (NAV-1: pre-fill, not send). */
  const handleChipSelect = useCallback((prompt: string) => {
    setInput(prompt);
    // Focus the input so the user can review / edit before sending
    inputRef.current?.focus();
  }, []);

  // Show suggestions in empty state (only welcome message) OR after a completed task
  const lastMsg = messages[messages.length - 1];
  const isPostTask =
    lastMsg &&
    messages.length > 1 &&
    (lastMsg.type === "action-card" ||
      (lastMsg.type === "text" &&
        lastMsg.role === "agent" &&
        /created|complete|done|added|scheduled/i.test(lastMsg.content)));
  const showSuggestions = messages.length <= 1 || isPostTask;

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

          {/* Contextual quick-command suggestion chips (NAV-1) */}
          {showSuggestions && (
            <div className="mt-8">
              <QuickCommandChips
                messages={messages}
                onSelect={handleChipSelect}
              />
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

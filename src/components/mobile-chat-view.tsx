"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { ChatBubble, ProgressIndicator, ActionCard, JDPreviewCard, QuickCommandChips, useChat } from "@/components/chat";

/**
 * MobileChatView — Full-screen chat interface for mobile (<768px).
 * Rendered as the primary tab in mobile bottom-nav layout.
 * Messages are stored in the Zustand sidebar store so they persist
 * across tab switches (unmount/remount).
 */
export function MobileChatView() {
  const { messages, handleSend, handleJDConfirm, handleJDModify } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  /** Pre-fill input with the chip's prompt text (NAV-1). */
  const handleChipSelect = useCallback((prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  }, []);

  // Show suggestions in empty state or after completed tasks
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
          <div className="mt-4">
            <QuickCommandChips
              messages={messages}
              onSelect={handleChipSelect}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input — positioned above the bottom nav (pb accounts for nav height) */}
      <div className="border-t border-border-default p-3 pb-4">
        <div className="flex items-center gap-2 bg-surface-secondary border border-border-default">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent..."
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none font-body"
            data-testid="mobile-chat-input"
          />
          <button
            onClick={onSend}
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

"use client";

import { Robot, User } from "@phosphor-icons/react";
import type { ChatMessage } from "./chat-types";

/**
 * ChatBubble — Single message in the chat thread.
 * User messages: #D4FF00 bg, #0D0D0D text, rectangular.
 * Agent messages: #1A1A1A bg, default text, rectangular.
 */
export function ChatBubble({ message }: { message: ChatMessage }) {
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

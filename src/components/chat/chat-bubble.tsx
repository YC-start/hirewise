"use client";

import { Robot, User } from "@phosphor-icons/react";
import type { ChatMessage } from "./chat-types";

/**
 * ChatBubble — Single message in the chat thread.
 * User messages: #D4FF00 bg, #0D0D0D text, rectangular.
 * Agent messages: #1A1A1A bg, default text, rectangular.
 * Both: max 4px border-radius, no speech-bubble tails.
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
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 mt-0.5"
        style={{
          backgroundColor: isUser ? "#D4FF00" : "#262626",
          color: isUser ? "#0D0D0D" : "#888888",
          borderRadius: "2px",
        }}
      >
        {isUser ? (
          <User size={14} weight="bold" />
        ) : (
          <Robot size={14} weight="bold" />
        )}
      </div>

      {/* Message bubble — rectangular, no speech-bubble tails, max 4px border-radius */}
      <div
        className="max-w-[85%] px-3 py-2 text-sm leading-relaxed"
        style={{
          backgroundColor: isUser ? "#D4FF00" : "#1A1A1A",
          color: isUser ? "#0D0D0D" : "#E8E8E8",
          borderRadius: "4px",
          border: isUser ? "none" : "1px solid #333333",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

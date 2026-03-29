"use client";

import { PROGRESS_STEPS } from "./chat-types";
import type { ProgressState } from "./chat-types";

/**
 * ProgressIndicator — Segmented progress bar with real-time status text.
 *
 * Visual spec ("Industrial Clarity"):
 * - 4 horizontal segments with 2px gap between each
 * - Filled segments: accent-primary (#D4FF00)
 * - Unfilled segments: surface-tertiary (#262626)
 * - No border-radius (flat/square industrial style)
 * - Status text: JetBrains Mono, 13px, text-secondary (#888888)
 * - Container: surface-secondary bg, border-default border
 */
export function ProgressIndicator({ progress }: { progress: ProgressState }) {
  const { currentStep, statusText, isComplete } = progress;
  const totalSteps = PROGRESS_STEPS.length;

  return (
    <div
      className="bg-surface-secondary border border-border-default p-3"
      data-testid="progress-indicator"
      style={{ borderRadius: 0 }}
    >
      {/* Step labels row */}
      <div className="flex mb-2" style={{ gap: "2px" }}>
        {PROGRESS_STEPS.map((step, idx) => (
          <div key={step.key} className="flex-1 text-center">
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{
                fontFamily: "var(--font-mono)",
                color:
                  idx <= currentStep
                    ? "var(--accent-primary)"
                    : "var(--text-muted)",
              }}
            >
              {step.key === "complete" ? "Done" : step.key}
            </span>
          </div>
        ))}
      </div>

      {/* Segmented progress bar */}
      <div
        className="flex w-full"
        style={{ gap: "2px", height: "6px" }}
        data-testid="progress-bar"
        role="progressbar"
        aria-valuenow={isComplete ? 100 : Math.round(((currentStep + 1) / totalSteps) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {PROGRESS_STEPS.map((step, idx) => {
          const isFilled = idx <= currentStep;
          const isActive = idx === currentStep && !isComplete;
          return (
            <div
              key={step.key}
              className="flex-1"
              style={{
                borderRadius: 0,
                backgroundColor: isFilled
                  ? "var(--accent-primary)"
                  : "var(--surface-tertiary)",
                animation: isActive
                  ? "pulse-segment 1.2s ease-in-out infinite"
                  : undefined,
              }}
              data-testid={`progress-segment-${step.key}`}
            />
          );
        })}
      </div>

      {/* Status text */}
      <p
        className="mt-2 text-text-secondary"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          lineHeight: "1.4",
        }}
        data-testid="progress-status-text"
      >
        {statusText}
      </p>
    </div>
  );
}

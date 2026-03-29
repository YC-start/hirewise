"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import type { ActionCardData } from "./chat-types";

/**
 * ActionCard — Structured result card rendered inline in the chat thread.
 *
 * Visual spec ("Industrial Clarity"):
 * - Left border: 4px accent-secondary (#00D4AA)
 * - Background: surface-tertiary (#262626)
 * - Title row: bold heading (Space Grotesk)
 * - Summary text
 * - Key metrics: label/value pairs in monospace
 * - CTA button: pill-shaped, accent-primary bg, dark text
 * - No border-radius on card (max 4px per spec)
 */
export function ActionCard({ data }: { data: ActionCardData }) {
  return (
    <div
      className="bg-surface-tertiary"
      style={{
        borderLeft: "4px solid var(--accent-secondary)",
        borderRadius: 0,
      }}
      data-testid="action-card"
    >
      {/* Title */}
      <div className="px-4 pt-3 pb-1">
        <h3
          className="font-heading text-sm font-bold text-accent-secondary tracking-wide uppercase"
          data-testid="action-card-title"
        >
          {data.title}
        </h3>
      </div>

      {/* Summary */}
      <div className="px-4 pb-2">
        <p
          className="text-sm text-text-primary leading-relaxed"
          data-testid="action-card-summary"
        >
          {data.summary}
        </p>
      </div>

      {/* Key metrics */}
      {data.metrics.length > 0 && (
        <div
          className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1"
          data-testid="action-card-metrics"
        >
          {data.metrics.map((metric) => (
            <div key={metric.label} className="flex items-baseline gap-1.5">
              <span
                className="text-text-muted uppercase tracking-wider"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                }}
              >
                {metric.label}
              </span>
              <span
                className="text-text-primary font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "15px",
                }}
              >
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA Button */}
      <div className="px-4 pb-3">
        <Link
          href={data.actionHref}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors bg-accent-primary text-surface-primary hover:opacity-90"
          data-testid="action-card-cta"
        >
          {data.actionLabel}
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </div>
  );
}

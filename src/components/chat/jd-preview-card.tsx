"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle,
  PencilSimple,
  MapPin,
  Briefcase,
  Clock,
  Buildings,
  GraduationCap,
} from "@phosphor-icons/react";
import type { JDPreviewData } from "./chat-types";

/**
 * JDPreviewCard — Structured JD preview rendered inline in the chat thread.
 *
 * Displayed when the Agent extracts structured job information from
 * a natural-language hiring request (FLOW-1).
 *
 * Visual spec ("Industrial Clarity"):
 * - Left border: 4px accent-primary (#D4FF00) — distinguishes from ActionCard (accent-secondary)
 * - Background: surface-tertiary (#262626)
 * - Data fields: label in table-header style (11px uppercase), value in Inter 14px text-primary
 * - Skill tags: accent-primary border, monospace font
 * - Confirm button: accent-primary, pill-shaped
 * - Modify button: ghost style (transparent bg, border)
 */
export function JDPreviewCard({
  data,
  onConfirm,
  onModify,
}: {
  data: JDPreviewData;
  onConfirm: (data: JDPreviewData) => void;
  onModify: (data: JDPreviewData) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<JDPreviewData>(data);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleFieldChange = useCallback(
    (field: keyof JDPreviewData, value: string | string[]) => {
      setEditData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSkillsChange = useCallback((value: string) => {
    const skills = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setEditData((prev) => ({ ...prev, skills }));
  }, []);

  const handleConfirm = useCallback(() => {
    setIsConfirmed(true);
    setIsEditing(false);
    onConfirm(isEditing ? editData : data);
  }, [onConfirm, data, editData, isEditing]);

  const handleModify = useCallback(() => {
    if (isEditing) {
      // Save edits and show preview again
      setIsEditing(false);
      onModify(editData);
    } else {
      setIsEditing(true);
    }
  }, [isEditing, editData, onModify]);

  const displayData = isEditing ? editData : data;

  if (isConfirmed) {
    return (
      <div
        className="bg-surface-tertiary"
        style={{
          borderLeft: "4px solid var(--accent-primary)",
          borderRadius: 0,
        }}
        data-testid="jd-preview-card-confirmed"
      >
        <div className="px-4 py-3 flex items-center gap-2">
          <CheckCircle
            size={18}
            weight="fill"
            className="text-accent-primary"
          />
          <span className="font-heading text-sm font-bold text-accent-primary">
            Job Created
          </span>
        </div>
        <div className="px-4 pb-3">
          <p className="text-sm text-text-primary">
            <span className="font-bold">{displayData.title}</span> —{" "}
            {displayData.location}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Status: Draft | {displayData.department}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-surface-tertiary"
      style={{
        borderLeft: "4px solid var(--accent-primary)",
        borderRadius: 0,
      }}
      data-testid="jd-preview-card"
    >
      {/* Title row */}
      <div className="px-4 pt-3 pb-2">
        <h3
          className="font-heading text-sm font-bold text-accent-primary tracking-wide uppercase"
          data-testid="jd-preview-title"
        >
          JD Preview
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Review and confirm the extracted job details
        </p>
      </div>

      {/* Structured data grid */}
      <div className="px-4 pb-3 space-y-2.5" data-testid="jd-preview-fields">
        {/* Title */}
        <FieldRow
          icon={<Briefcase size={13} weight="bold" />}
          label="Position"
          value={displayData.title}
          isEditing={isEditing}
          onChange={(v) => handleFieldChange("title", v)}
        />

        {/* Department */}
        <FieldRow
          icon={<Buildings size={13} weight="bold" />}
          label="Department"
          value={displayData.department}
          isEditing={isEditing}
          onChange={(v) => handleFieldChange("department", v)}
        />

        {/* Location */}
        <FieldRow
          icon={<MapPin size={13} weight="bold" />}
          label="Location"
          value={displayData.location}
          isEditing={isEditing}
          onChange={(v) => handleFieldChange("location", v)}
        />

        {/* Experience */}
        <FieldRow
          icon={<Clock size={13} weight="bold" />}
          label="Experience"
          value={displayData.experience}
          isEditing={isEditing}
          onChange={(v) => handleFieldChange("experience", v)}
        />

        {/* Seniority */}
        <FieldRow
          icon={<GraduationCap size={13} weight="bold" />}
          label="Seniority"
          value={displayData.seniority}
          isEditing={isEditing}
          onChange={(v) => handleFieldChange("seniority", v)}
        />

        {/* Skills */}
        <div className="flex items-start gap-2">
          <span className="text-text-muted mt-0.5 flex-shrink-0">
            <Briefcase size={13} weight="bold" />
          </span>
          <div className="flex-1 min-w-0">
            <span
              className="text-text-muted uppercase tracking-wider block mb-1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
              }}
            >
              Skills
            </span>
            {isEditing ? (
              <input
                type="text"
                value={displayData.skills.join(", ")}
                onChange={(e) => handleSkillsChange(e.target.value)}
                className="w-full bg-surface-primary border border-border-default px-2 py-1 text-sm text-text-primary font-body outline-none focus:border-accent-primary"
                data-testid="jd-edit-skills"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {displayData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2 py-0.5 border border-accent-primary text-accent-primary"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      borderRadius: "var(--radius-max)",
                    }}
                    data-testid="jd-skill-tag"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="pt-1">
          <span
            className="text-text-muted uppercase tracking-wider block mb-1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.08em",
            }}
          >
            Description
          </span>
          {isEditing ? (
            <textarea
              value={displayData.description}
              onChange={(e) =>
                handleFieldChange("description", e.target.value)
              }
              rows={3}
              className="w-full bg-surface-primary border border-border-default px-2 py-1.5 text-sm text-text-primary font-body outline-none focus:border-accent-primary resize-none"
              data-testid="jd-edit-description"
            />
          ) : (
            <p
              className="text-sm text-text-primary leading-relaxed"
              data-testid="jd-preview-description"
            >
              {displayData.description}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button
          onClick={handleConfirm}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors bg-accent-primary text-surface-primary hover:opacity-90"
          data-testid="jd-confirm-btn"
        >
          <CheckCircle size={14} weight="bold" />
          {isEditing ? "Save & Create Job" : "Confirm & Create Job"}
        </button>
        <button
          onClick={handleModify}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors border border-border-default text-text-secondary hover:text-text-primary hover:border-text-secondary bg-transparent"
          data-testid="jd-modify-btn"
        >
          <PencilSimple size={14} weight="bold" />
          {isEditing ? "Done Editing" : "Modify"}
        </button>
      </div>
    </div>
  );
}

/**
 * FieldRow — A single label/value row in the JD preview grid.
 * In edit mode, shows an input field. In view mode, shows text.
 */
function FieldRow({
  icon,
  label,
  value,
  isEditing,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span
          className="text-text-muted uppercase tracking-wider"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
        {isEditing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-surface-primary border border-border-default px-2 py-1 text-sm text-text-primary font-body outline-none focus:border-accent-primary mt-0.5"
            data-testid={`jd-edit-${label.toLowerCase()}`}
          />
        ) : (
          <p className="text-sm text-text-primary font-body">{value}</p>
        )}
      </div>
    </div>
  );
}

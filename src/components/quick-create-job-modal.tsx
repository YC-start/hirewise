"use client";

import { useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { Job } from "@/data/mock-jobs";

// ── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Operations",
] as const;

const SENIORITY_LEVELS = [
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Principal",
] as const;

type Department = (typeof DEPARTMENTS)[number];
type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

// ── Component ────────────────────────────────────────────────────────────────

export function QuickCreateJobModal() {
  const { isCreateModalOpen, closeCreateModal, addJob } = useDashboardStore();

  // ── Form state ──
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<Department | "">("");
  const [seniority, setSeniority] = useState<SeniorityLevel | "">("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDepartment("");
    setSeniority("");
    setDescription("");
    setTitleError(false);
  }, []);

  const handleClose = useCallback(() => {
    closeCreateModal();
    resetForm();
  }, [closeCreateModal, resetForm]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required field
      if (!title.trim()) {
        setTitleError(true);
        return;
      }

      const newJob: Job = {
        id: `new-${Date.now()}`,
        title: title.trim(),
        department: department || "Engineering",
        status: "Draft",
        resumes: 0,
        highScore: 0,
        interviews: 0,
        jd: {
          seniority: seniority || "Mid",
          skills: [],
          summary: description.trim(),
        },
      };

      addJob(newJob);
      handleClose();
    },
    [title, department, seniority, description, addJob, handleClose],
  );

  return (
    <Dialog.Root open={isCreateModalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          data-testid="modal-overlay"
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-[480px] -translate-x-1/2 -translate-y-1/2 border border-border-default bg-surface-secondary p-6 focus:outline-none"
          style={{ borderRadius: "4px" }}
          data-testid="quick-create-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="font-heading text-lg font-700 text-text-primary">
              Create New Job
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close"
                data-testid="modal-close-btn"
              >
                <X size={18} weight="bold" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Job Title (required) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="job-title"
                className="text-text-muted text-[11px] font-medium uppercase tracking-[0.08em]"
              >
                Job Title <span className="text-signal-danger">*</span>
              </label>
              <input
                id="job-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError(false);
                }}
                placeholder="e.g. Senior Backend Engineer"
                className={`h-10 px-3 bg-surface-primary border text-text-primary text-sm font-body placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors ${
                  titleError ? "border-signal-danger" : "border-border-default"
                }`}
                style={{ borderRadius: "4px" }}
                data-testid="input-job-title"
                autoFocus
              />
              {titleError && (
                <span className="text-signal-danger text-xs" data-testid="title-error">
                  Job title is required
                </span>
              )}
            </div>

            {/* Department (dropdown) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="department"
                className="text-text-muted text-[11px] font-medium uppercase tracking-[0.08em]"
              >
                Department
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="h-10 px-3 bg-surface-primary border border-border-default text-text-primary text-sm font-body focus:outline-none focus:border-accent-primary transition-colors appearance-none cursor-pointer"
                style={{ borderRadius: "4px" }}
                data-testid="select-department"
              >
                <option value="" className="bg-surface-primary text-text-muted">
                  Select department
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-surface-primary text-text-primary">
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Seniority Level (dropdown) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="seniority"
                className="text-text-muted text-[11px] font-medium uppercase tracking-[0.08em]"
              >
                Seniority Level
              </label>
              <select
                id="seniority"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
                className="h-10 px-3 bg-surface-primary border border-border-default text-text-primary text-sm font-body focus:outline-none focus:border-accent-primary transition-colors appearance-none cursor-pointer"
                style={{ borderRadius: "4px" }}
                data-testid="select-seniority"
              >
                <option value="" className="bg-surface-primary text-text-muted">
                  Select seniority level
                </option>
                {SENIORITY_LEVELS.map((level) => (
                  <option key={level} value={level} className="bg-surface-primary text-text-primary">
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Description (optional textarea) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="description"
                className="text-text-muted text-[11px] font-medium uppercase tracking-[0.08em]"
              >
                Description <span className="text-text-muted text-[10px] normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief job description..."
                rows={3}
                className="px-3 py-2 bg-surface-primary border border-border-default text-text-primary text-sm font-body placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-none"
                style={{ borderRadius: "4px" }}
                data-testid="input-description"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-heading font-700 text-text-secondary hover:text-text-primary transition-colors"
                data-testid="modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-accent-primary text-surface-primary font-heading text-sm font-700 rounded-full hover:opacity-90 transition-opacity"
                data-testid="modal-submit-btn"
              >
                Create Job
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

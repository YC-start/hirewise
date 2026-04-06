"use client";

import { useEffect, useState } from "react";
import { PaperPlaneTilt, NotePencil } from "@phosphor-icons/react";
import { useNotesStore, type Note } from "@/stores/notes-store";
import { CURRENT_USER } from "@/data/mock-jobs";

/**
 * CandidateNotes (D-5)
 *
 * "Notes & Activity" tab for a candidate profile. Team members can leave
 * internal notes visible to everyone on the hiring team. Notes are
 * persisted to localStorage via Zustand persist middleware so they
 * survive page reloads.
 *
 * In a production system this would be backed by Supabase with realtime
 * broadcast to other team members. For the demo, single-client
 * persistence is sufficient to satisfy the full flow: submit → feed →
 * reload → still there.
 *
 * Design: Industrial Clarity — dark surfaces, 1px borders, monospace
 * timestamps, accent-secondary timeline dots echoing the existing
 * experience/education timelines in the Overview tab.
 */

interface CandidateNotesProps {
  candidateId: string;
  jobId: string;
  candidateName: string;
}

export function CandidateNotes({
  candidateId,
  jobId,
  candidateName,
}: CandidateNotesProps) {
  const addNote = useNotesStore((s) => s.addNote);
  // Subscribe to the raw map so the feed re-renders after addNote.
  // We filter/sort in a derived value below rather than calling the
  // getNotes() selector (which would return a fresh array every render).
  const notesMap = useNotesStore((s) => s.notesByCandidate);
  const scopeKey = `${jobId}:${candidateId}`;
  const rawNotes = notesMap[scopeKey];

  // Avoid SSR/CSR hydration mismatch: persist rehydrates on the client,
  // so we delay rendering note content (and relative timestamps) until
  // after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const notes: Note[] = mounted && rawNotes
    ? [...rawNotes].sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const [draft, setDraft] = useState("");
  const trimmedLength = draft.trim().length;
  const canSubmit = trimmedLength > 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    addNote(jobId, candidateId, draft, CURRENT_USER);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter to post — common recruiter shortcut.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (canSubmit) {
        addNote(jobId, candidateId, draft, CURRENT_USER);
        setDraft("");
      }
    }
  }

  return (
    <section
      className="mb-8"
      data-testid="notes-tab-panel"
      aria-labelledby="notes-section-heading"
    >
      {/* Section header */}
      <header className="mb-4" data-testid="notes-header">
        <h2
          id="notes-section-heading"
          className="table-header pb-2 border-b border-border-default flex items-center gap-2"
        >
          <NotePencil size={12} weight="bold" aria-hidden="true" />
          <span>
            Notes &amp; Activity
            <span
              className="ml-2 text-text-muted"
              data-testid="notes-count"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              · {mounted ? notes.length : 0}{" "}
              {mounted && notes.length === 1 ? "note" : "notes"}
            </span>
          </span>
        </h2>
        <p
          className="text-text-secondary leading-relaxed mt-2"
          style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}
        >
          Internal notes on{" "}
          <span className="text-text-primary font-medium">{candidateName}</span>
          . Visible to everyone on the hiring team for this role.
        </p>
      </header>

      {/* Compose form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-surface-secondary border border-border-default"
        data-testid="note-compose-form"
      >
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-default">
          <span className="table-header text-[10px]">
            Posting as{" "}
            <span className="text-accent-secondary">{CURRENT_USER}</span>
          </span>
          <span
            className="font-mono text-[10px] text-text-muted"
            style={{ fontVariantNumeric: "tabular-nums" }}
            data-testid="note-char-count"
            aria-label="Character count"
          >
            {trimmedLength}
          </span>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note for the hiring team..."
          rows={3}
          data-testid="note-input"
          aria-label="Write a note"
          className="w-full bg-transparent px-3 py-2 text-text-primary placeholder:text-text-muted outline-none resize-y min-h-[80px]"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: "1.55",
          }}
        />
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-border-default">
          <span className="text-text-muted text-[11px] font-mono hidden sm:inline">
            <kbd className="px-1 py-px border border-border-default">Ctrl</kbd>
            {" "}+{" "}
            <kbd className="px-1 py-px border border-border-default">Enter</kbd>
            {" "}to post
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            data-testid="note-submit-btn"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-mono font-medium uppercase tracking-wider transition-all duration-150 ${
              canSubmit
                ? "bg-accent-primary text-surface-primary hover:brightness-110 active:brightness-90"
                : "bg-surface-tertiary text-text-muted opacity-40 cursor-not-allowed"
            }`}
            style={{ letterSpacing: "0.08em" }}
          >
            <PaperPlaneTilt size={12} weight="bold" aria-hidden="true" />
            <span>Post Note</span>
          </button>
        </div>
      </form>

      {/* Activity feed */}
      {mounted && notes.length === 0 && (
        <div
          className="bg-surface-secondary border border-dashed border-border-default p-6 text-center"
          data-testid="notes-empty-state"
        >
          <p
            className="text-text-secondary"
            style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
          >
            No notes yet. Be the first to leave a note for the hiring team.
          </p>
          <p className="text-text-muted text-[11px] font-mono mt-2">
            Notes persist across sessions and are shared with everyone on the role.
          </p>
        </div>
      )}

      {mounted && notes.length > 0 && (
        <div className="relative" data-testid="notes-feed">
          {/* Timeline vertical line — matches Overview tab experience/education style */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-border-default"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-0">
            {notes.map((note, idx) => (
              <NoteItem
                key={note.id}
                note={note}
                isLast={idx === notes.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Note Item ──────────────────────────────────────────────────────────────

function NoteItem({ note, isLast }: { note: Note; isLast: boolean }) {
  const absolute = new Date(note.createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const relative = formatRelativeTime(note.createdAt);

  return (
    <div
      className={`relative pl-8 ${isLast ? "pb-0" : "pb-4"}`}
      data-testid="note-item"
    >
      {/* Square node on timeline — accent-secondary (teal), echoing Education */}
      <div
        className="absolute left-[3px] top-[10px] w-[9px] h-[9px] bg-accent-secondary"
        aria-hidden="true"
      />

      {/* Note card */}
      <article className="bg-surface-secondary border border-border-default p-3">
        <header className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className="text-[13px] font-medium text-text-primary truncate"
            data-testid="note-author"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {note.author}
          </span>
          <time
            dateTime={new Date(note.createdAt).toISOString()}
            title={absolute}
            data-testid="note-timestamp"
            className="font-mono text-[11px] text-text-muted whitespace-nowrap flex-shrink-0"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {relative}
          </time>
        </header>
        <p
          className="text-text-primary whitespace-pre-wrap break-words"
          data-testid="note-body"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: "1.55",
          }}
        >
          {note.body}
        </p>
      </article>
    </div>
  );
}

// ── Relative Time Helper ───────────────────────────────────────────────────

/**
 * Formats a past timestamp as a short relative string ("just now",
 * "2m ago", "3h ago", "5d ago"). For anything older than 14 days, falls
 * back to a short absolute date to keep the feed scannable.
 */
function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  if (diffMs < 0) return "just now";

  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;

  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

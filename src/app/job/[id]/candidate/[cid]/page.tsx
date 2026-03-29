import Link from "next/link";
import { AppShell } from "@/components/app-shell";

/**
 * Candidate Profile page — placeholder for Module D features.
 *
 * D-1: Resume inline preview
 * D-2: AI Evaluation Report display
 * D-3: AI-generated interview questions
 * D-4: Pipeline stage transition buttons
 * D-5: Internal notes on candidate
 */
export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string; cid: string }>;
}) {
  const { id, cid } = await params;

  return (
    <AppShell>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center h-12 px-4 border-b border-border-default bg-surface-primary">
          <Link
            href={`/job/${id}/pipeline`}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm font-mono transition-colors"
          >
            <span>&larr;</span>
            <span>Back to Pipeline</span>
          </Link>
        </header>

        {/* Placeholder content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-heading text-xl font-700 text-text-primary mb-2">
              Candidate Profile
            </h2>
            <p className="text-text-muted text-sm font-mono mb-1">
              Job #{id} / Candidate #{cid}
            </p>
            <p className="text-text-muted text-xs mt-4">
              Resume, AI Evaluation, Interview Prep, Notes &mdash; coming in Module D
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

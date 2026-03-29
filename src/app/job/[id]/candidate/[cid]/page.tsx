import { AppShell } from "@/components/app-shell";
import { CandidateProfile } from "@/components/candidate-profile";
import { getCandidateById } from "@/data/mock-candidates";
import { MOCK_JOBS } from "@/data/mock-jobs";
import Link from "next/link";

/**
 * Candidate Profile page — Module D features.
 *
 * D-1: Resume inline preview (structured timeline)
 * D-2: AI Evaluation Report display (future)
 * D-3: AI-generated interview questions (future)
 * D-4: Pipeline stage transition buttons (future)
 * D-5: Internal notes on candidate (future)
 */
export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string; cid: string }>;
}) {
  const { id, cid } = await params;

  const candidate = getCandidateById(id, cid);
  const job = MOCK_JOBS.find((j) => j.id === id);
  const jobTitle = job?.title || `Job #${id}`;

  // Not found fallback
  if (!candidate) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex-shrink-0 flex items-center h-12 px-4 border-b border-border-default bg-surface-primary">
            <Link
              href={`/job/${id}/pipeline`}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm font-mono transition-colors"
            >
              <span>&larr;</span>
              <span>Back to Pipeline</span>
            </Link>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-heading text-xl font-700 text-text-primary mb-2">
                Candidate Not Found
              </h2>
              <p className="text-text-muted text-sm font-mono">
                No candidate with ID &quot;{cid}&quot; was found for job #{id}.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CandidateProfile candidate={candidate} jobId={id} jobTitle={jobTitle} />
    </AppShell>
  );
}

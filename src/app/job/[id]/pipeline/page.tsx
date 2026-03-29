import { AppShell } from "@/components/app-shell";
import { PipelineView } from "@/components/pipeline-view";

/**
 * Pipeline page — Candidate ranking view for a specific job.
 *
 * C-1: Left rail with JD context tags (required skills, nice-to-haves, seniority)
 * C-2: Ranked candidate list with scores (coming next)
 */
export default async function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <PipelineView jobId={id} />
    </AppShell>
  );
}

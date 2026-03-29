import { AppShell } from "@/components/app-shell";

/**
 * Pipeline page — placeholder for C-1 / C-2 implementation.
 * Displays the candidate ranking view for a specific job.
 */
export default async function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-xl font-700 text-text-primary mb-2">
            Pipeline — Job #{id}
          </h2>
          <p className="text-text-muted text-sm font-mono">
            Candidate ranking view coming soon (C-1 / C-2)
          </p>
        </div>
      </div>
    </AppShell>
  );
}

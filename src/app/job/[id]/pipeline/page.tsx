"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PipelineView } from "@/components/pipeline-view";
import { useDataPanelStore } from "@/stores/data-panel-store";

/**
 * Pipeline page — Renders PipelineView (left rail JD context + candidate list)
 * as the main content inside AppShell. The right sidebar data panel is
 * automatically set to the Pipeline tab for the given job.
 */
export default function PipelinePage() {
  const params = useParams();
  const id = params.id as string;
  const { selectJob, setDataPanelOpen } = useDataPanelStore();

  useEffect(() => {
    if (id) {
      selectJob(id);
      setDataPanelOpen(true);
    }
  }, [id, selectJob, setDataPanelOpen]);

  return (
    <AppShell>
      <PipelineView jobId={id} />
    </AppShell>
  );
}

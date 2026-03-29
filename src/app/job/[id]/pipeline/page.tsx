"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useDataPanelStore } from "@/stores/data-panel-store";

/**
 * Pipeline page — In ARCH-1, navigating to /job/[id]/pipeline
 * opens the AppShell with the data panel automatically set to Pipeline tab
 * for the given job.
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

  return <AppShell>{null}</AppShell>;
}

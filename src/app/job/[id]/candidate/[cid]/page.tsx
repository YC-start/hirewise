"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useDataPanelStore } from "@/stores/data-panel-store";

/**
 * Candidate Profile page — In ARCH-1, navigating to /job/[id]/candidate/[cid]
 * opens the AppShell with the data panel automatically set to Profile tab
 * for the given candidate.
 */
export default function CandidateProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const cid = params.cid as string;
  const { selectCandidate, setDataPanelOpen } = useDataPanelStore();

  useEffect(() => {
    if (id && cid) {
      selectCandidate(id, cid);
      setDataPanelOpen(true);
    }
  }, [id, cid, selectCandidate, setDataPanelOpen]);

  return <AppShell>{null}</AppShell>;
}

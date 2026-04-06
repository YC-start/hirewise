"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CandidateProfile } from "@/components/candidate-profile";
import { useDataPanelStore } from "@/stores/data-panel-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useCandidateStore } from "@/stores/candidate-store";
import { getCandidateById } from "@/data/mock-candidates";
import type { Candidate } from "@/data/mock-candidates";

const EMPTY_CANDIDATES: Candidate[] = [];

/**
 * Candidate Profile page — Renders the full CandidateProfile timeline view
 * as the main content inside AppShell. The right sidebar data panel is
 * automatically set to the Profile tab for the given candidate.
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

  // Resolve candidate: check API store first, then fall back to mock data
  const apiCandidates = useCandidateStore((s) => s.candidatesByJob[id] ?? EMPTY_CANDIDATES);
  const candidate = apiCandidates.find((c) => c.id === cid) || getCandidateById(id, cid);

  const dashboardJobs = useDashboardStore((s) => s.jobs);
  const job = dashboardJobs.find((j) => j.id === id);
  const jobTitle = job?.title || "Unknown Position";
  const jd = job?.jd;

  if (!candidate) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-sm font-mono">Candidate not found</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CandidateProfile candidate={candidate} jobId={id} jobTitle={jobTitle} jd={jd} />
    </AppShell>
  );
}

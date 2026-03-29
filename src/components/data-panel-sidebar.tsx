"use client";

import { useEffect } from "react";
import {
  Briefcase,
  Funnel,
  UserCircle,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { useDataPanelStore, type DataPanelTab } from "@/stores/data-panel-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { JobsPanelContent } from "@/components/panels/jobs-panel";
import { PipelinePanelContent } from "@/components/panels/pipeline-panel";
import { ProfilePanelContent } from "@/components/panels/profile-panel";

/**
 * DataPanelSidebar — Right-side collapsible sidebar containing data panels.
 *
 * Tabs:
 * - Jobs: Dashboard content (job card grid/list)
 * - Pipeline: Candidate ranking for selected job
 * - Profile: Candidate detail for selected candidate
 *
 * Visual design:
 * - surface-secondary (#1A1A1A) background
 * - Left 1px border-default separator
 * - Tab switching with underline indicator
 * - Collapse button on left edge
 * - ~35-40% width on desktop
 */

interface TabConfig {
  id: DataPanelTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: "jobs", label: "Jobs", icon: <Briefcase size={16} weight="bold" /> },
  { id: "pipeline", label: "Pipeline", icon: <Funnel size={16} weight="bold" /> },
  { id: "profile", label: "Profile", icon: <UserCircle size={16} weight="bold" /> },
];

export function DataPanelSidebar() {
  const {
    isDataPanelOpen,
    activeTab,
    toggleDataPanel,
    setActiveTab,
    setDataPanelOpen,
  } = useDataPanelStore();

  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)");
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  // Auto-collapse on tablet
  useEffect(() => {
    if (isTablet) {
      setDataPanelOpen(false);
    }
  }, [isTablet, setDataPanelOpen]);

  // Auto-expand on desktop
  useEffect(() => {
    if (isDesktop) {
      setDataPanelOpen(true);
    }
  }, [isDesktop, setDataPanelOpen]);

  // Collapsed state — narrow strip with expand button
  if (!isDataPanelOpen) {
    return (
      <aside
        className="flex flex-col flex-shrink-0 border-l border-border-default bg-surface-secondary sidebar-transition"
        style={{ width: "var(--sidebar-collapsed-width)" }}
        data-testid="data-panel-collapsed"
      >
        <div className="flex items-center justify-center h-12 border-b border-border-default">
          <button
            onClick={toggleDataPanel}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Expand data panel"
            data-testid="data-panel-toggle"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
        </div>

        {/* Tab icons in collapsed state */}
        <div className="flex flex-col items-center gap-4 pt-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setDataPanelOpen(true);
              }}
              className={`p-2 transition-colors ${
                activeTab === tab.id
                  ? "text-accent-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              aria-label={tab.label}
              data-testid={`data-panel-icon-${tab.id}`}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  // Expanded state
  return (
    <aside
      className="flex flex-col flex-shrink-0 border-l border-border-default bg-surface-secondary sidebar-transition overflow-hidden"
      style={{ width: "var(--data-panel-width)" }}
      data-testid="data-panel-expanded"
    >
      {/* Header with collapse button + tab bar */}
      <div className="flex-shrink-0 border-b border-border-default">
        {/* Top row: collapse button */}
        <div className="flex items-center h-12 px-2 border-b border-border-default">
          <button
            onClick={toggleDataPanel}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Collapse data panel"
            data-testid="data-panel-toggle"
          >
            <CaretRight size={18} weight="bold" />
          </button>
          <span className="ml-2 text-text-muted text-xs font-mono uppercase tracking-widest">
            Data Panel
          </span>
        </div>

        {/* Tab bar with underline indicator */}
        <div
          className="flex items-stretch h-10"
          data-testid="data-panel-tabs"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-colors relative ${
                  isActive
                    ? "text-accent-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                data-testid={`data-panel-tab-${tab.id}`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "jobs" && <JobsPanelContent />}
        {activeTab === "pipeline" && <PipelinePanelContent />}
        {activeTab === "profile" && <ProfilePanelContent />}
      </div>
    </aside>
  );
}

"use client";

import { useEffect } from "react";
import { ChatCircleDots, Briefcase, Funnel, UserCircle } from "@phosphor-icons/react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useDataPanelStore, type DataPanelTab } from "@/stores/data-panel-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ChatMainArea } from "@/components/chat-main-area";
import { DataPanelSidebar } from "@/components/data-panel-sidebar";
import { MobileChatView } from "@/components/mobile-chat-view";
import { JobsPanelContent } from "@/components/panels/jobs-panel";
import { PipelinePanelContent } from "@/components/panels/pipeline-panel";
import { ProfilePanelContent } from "@/components/panels/profile-panel";
import { QuickCreateJobModal } from "@/components/quick-create-job-modal";

/**
 * AppShell — Main layout wrapper (ARCH-1: Layout Flip).
 *
 * NEW LAYOUT:
 * - Center/Left: AI conversation area (~60-65% width) — PRIMARY
 * - Right: Data panel sidebar (~35-40% width) — collapsible
 *
 * Responsive behavior:
 * - Desktop (1280px+): Chat main area + data panel sidebar expanded.
 * - Tablet (768-1279px): Chat main area + data panel auto-collapsed to icon strip.
 * - Mobile (<768px): Full-screen chat as default tab, bottom nav for Jobs/Pipeline/Profile.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { mobileActiveTab, setMobileActiveTab } = useSidebarStore();
  const { activeTab, setActiveTab } = useDataPanelStore();

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 767px)");

  // --- Mobile layout ---
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-surface-primary">
        {/* Main content area — switches based on active tab */}
        <div className="flex-1 overflow-hidden">
          {mobileActiveTab === "chat" && <MobileChatView />}
          {mobileActiveTab === "dashboard" && (
            <div className="flex flex-col h-full overflow-hidden bg-surface-secondary">
              <JobsPanelContent />
            </div>
          )}
          {mobileActiveTab === "pipeline" && (
            <div className="flex flex-col h-full overflow-hidden bg-surface-secondary">
              <PipelinePanelContent />
            </div>
          )}
        </div>

        {/* Mobile Bottom Tab Navigation */}
        <MobileBottomNav
          activeTab={mobileActiveTab}
          onTabChange={setMobileActiveTab}
        />

        {/* Quick-create modal */}
        <QuickCreateJobModal />
      </div>
    );
  }

  // --- Desktop / Tablet layout ---
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-primary">
      {/* AI Conversation — Main Area (left/center, ~60-65%) */}
      <ChatMainArea />

      {/* Data Panel — Right Sidebar (~35-40%) */}
      <DataPanelSidebar />

      {/* Quick-create modal */}
      <QuickCreateJobModal />
    </div>
  );
}

// ── Mobile Bottom Navigation ───────────────────────────────────────────────

function MobileBottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: "chat" | "dashboard" | "pipeline") => void;
}) {
  const tabs: { id: "chat" | "dashboard" | "pipeline"; label: string; icon: React.ReactNode }[] = [
    {
      id: "chat",
      label: "Chat",
      icon: <ChatCircleDots size={22} weight="bold" />,
    },
    {
      id: "dashboard",
      label: "Jobs",
      icon: <Briefcase size={22} weight="bold" />,
    },
    {
      id: "pipeline",
      label: "Pipeline",
      icon: <Funnel size={22} weight="bold" />,
    },
  ];

  return (
    <nav
      className="flex-shrink-0 h-14 bg-surface-secondary border-t border-border-default flex items-center justify-around z-50 safe-area-bottom"
      data-testid="mobile-bottom-nav"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
            activeTab === tab.id
              ? "text-accent-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
          aria-label={tab.label}
          data-testid={`mobile-tab-${tab.id}`}
        >
          {tab.icon}
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

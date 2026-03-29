"use client";

import { useEffect } from "react";
import { ChatCircleDots, Briefcase, Funnel } from "@phosphor-icons/react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ChatSidebar } from "@/components/chat-sidebar";
import { MobileChatView } from "@/components/mobile-chat-view";

/**
 * AppShell — Main layout wrapper.
 * Left: Chat sidebar (collapsible). Right: Main content area.
 *
 * Responsive behavior:
 * - Desktop (1280px+): Sidebar expanded by default, manually collapsible.
 * - Tablet (768-1279px): Sidebar auto-collapses to icon strip.
 * - Mobile (<768px): Bottom tab navigation. Chat is a full-screen tab.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { mobileActiveTab, setMobileActiveTab, setExpanded } =
    useSidebarStore();

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)");

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) {
      setExpanded(false);
    }
  }, [isTablet, setExpanded]);

  // Auto-expand on desktop (when transitioning from tablet to desktop)
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  useEffect(() => {
    if (isDesktop) {
      setExpanded(true);
    }
  }, [isDesktop, setExpanded]);

  // --- Mobile layout ---
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-surface-primary">
        {/* Main content area — switches based on active tab */}
        <div className="flex-1 overflow-hidden">
          {mobileActiveTab === "chat" && <MobileChatView />}
          {mobileActiveTab === "dashboard" && (
            <main className="flex-1 flex flex-col overflow-hidden h-full">
              {children}
            </main>
          )}
          {mobileActiveTab === "pipeline" && (
            <main className="flex-1 flex flex-col overflow-hidden h-full">
              <div className="flex-1 flex items-center justify-center">
                <p className="text-text-muted text-sm font-mono">
                  Pipeline view — select a job first
                </p>
              </div>
            </main>
          )}
        </div>

        {/* Mobile Bottom Tab Navigation */}
        <nav
          className="flex-shrink-0 h-14 bg-surface-secondary border-t border-border-default flex items-center justify-around z-50 safe-area-bottom"
          data-testid="mobile-bottom-nav"
        >
          <button
            onClick={() => setMobileActiveTab("chat")}
            className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
              mobileActiveTab === "chat"
                ? "text-accent-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-label="Chat"
            data-testid="mobile-tab-chat"
          >
            <ChatCircleDots size={22} weight="bold" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <button
            onClick={() => setMobileActiveTab("dashboard")}
            className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
              mobileActiveTab === "dashboard"
                ? "text-accent-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-label="Jobs"
            data-testid="mobile-tab-dashboard"
          >
            <Briefcase size={22} weight="bold" />
            <span className="text-[10px] font-medium">Jobs</span>
          </button>
          <button
            onClick={() => setMobileActiveTab("pipeline")}
            className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
              mobileActiveTab === "pipeline"
                ? "text-accent-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-label="Pipeline"
            data-testid="mobile-tab-pipeline"
          >
            <Funnel size={22} weight="bold" />
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>
        </nav>
      </div>
    );
  }

  // --- Desktop / Tablet layout ---
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-primary">
      {/* Chat Sidebar */}
      <ChatSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

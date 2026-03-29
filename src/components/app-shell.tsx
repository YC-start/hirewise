"use client";

import { useState } from "react";
import { List, ChatCircleDots, Briefcase, Funnel } from "@phosphor-icons/react";

/**
 * AppShell — Main layout wrapper.
 * Left: Chat sidebar (collapsible). Right: Main content area.
 * Responsive: desktop sidebar, tablet icon-strip, mobile bottom-tab nav.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-primary">
      {/* --- Desktop / Tablet Sidebar --- */}
      <aside
        className={`
          hidden md:flex flex-col flex-shrink-0 border-r border-border-default
          bg-surface-secondary transition-[width] duration-200 ease-in-out
          ${sidebarOpen ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-collapsed-width)]"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-border-default">
          {sidebarOpen && (
            <span className="font-heading text-sm font-700 text-accent-primary tracking-wide uppercase">
              HireWise
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <List size={20} weight="bold" />
          </button>
        </div>

        {/* Sidebar Body — placeholder for LAYOUT-1 chat implementation */}
        <div className="flex-1 overflow-y-auto p-3">
          {sidebarOpen && (
            <div className="flex flex-col gap-2">
              <p className="text-text-muted text-xs font-mono uppercase tracking-widest">
                Agent Chat
              </p>
              <div className="border border-border-default bg-surface-primary p-3">
                <p className="text-text-secondary text-sm">
                  Chat interface will be implemented in LAYOUT-1.
                </p>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="flex flex-col items-center gap-4 pt-2">
              <ChatCircleDots
                size={22}
                weight="bold"
                className="text-text-secondary hover:text-accent-primary cursor-pointer transition-colors"
              />
            </div>
          )}
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* --- Mobile Bottom Tab Navigation (below 768px) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface-secondary border-t border-border-default flex items-center justify-around z-50">
        <button className="flex flex-col items-center gap-0.5 p-2 text-accent-primary">
          <ChatCircleDots size={22} weight="bold" />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 p-2 text-text-secondary hover:text-text-primary transition-colors">
          <Briefcase size={22} weight="bold" />
          <span className="text-[10px] font-medium">Jobs</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 p-2 text-text-secondary hover:text-text-primary transition-colors">
          <Funnel size={22} weight="bold" />
          <span className="text-[10px] font-medium">Pipeline</span>
        </button>
      </nav>
    </div>
  );
}

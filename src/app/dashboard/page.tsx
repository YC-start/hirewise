"use client";

/**
 * Dashboard page — Now serves as the main landing page.
 *
 * In the ARCH-1 layout flip, the Jobs dashboard content lives in the
 * right sidebar data panel (Jobs tab). This page component is intentionally
 * minimal because AppShell (rendered by the dashboard layout) handles
 * the full layout: ChatMainArea (center) + DataPanelSidebar (right).
 *
 * The `children` prop of AppShell receives this component's output,
 * but AppShell no longer renders children in the main area — it renders
 * ChatMainArea directly. This page just needs to exist for the route.
 */
export default function DashboardPage() {
  // AppShell now handles the full layout — this page is a no-op shell.
  // Returning null since AppShell renders ChatMainArea + DataPanelSidebar directly.
  return null;
}

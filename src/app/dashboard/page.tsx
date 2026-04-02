"use client";

import { ChatMainArea } from "@/components/chat-main-area";

/**
 * Dashboard page — The main landing page.
 *
 * Renders ChatMainArea as the primary interaction surface (ARCH-1 layout).
 * The Jobs dashboard content lives in the right sidebar data panel (Jobs tab),
 * managed by the AppShell wrapper in the dashboard layout.
 */
export default function DashboardPage() {
  return <ChatMainArea />;
}

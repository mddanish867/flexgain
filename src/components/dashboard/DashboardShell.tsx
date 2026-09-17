"use client";

import { SidebarLayout } from "@/components/ui/SidebarLayout";

interface DashboardShellProps {
  user: { name: string; email: string };
  children: React.ReactNode;
}

/**
 * DashboardShell — client-side wrapper around SidebarLayout.
 * Server components (layouts, pages) pass a serialized user object here.
 */
export function DashboardShell({ user, children }: DashboardShellProps) {
  return <SidebarLayout user={user}>{children}</SidebarLayout>;
}

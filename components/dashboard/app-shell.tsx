"use client";

import type { ReactNode } from "react";

import { AppLayout } from "@heroui-pro/react";

import { DashboardSidebar } from "./dashboard-sidebar";

export interface AppShellProps {
  children: ReactNode;
  onNavigate: (href: string) => void;
  pathname: string;
}

export function AppShell({ children, onNavigate, pathname }: AppShellProps) {
  return (
    <AppLayout
      className="h-full min-h-0"
      navigate={() => undefined}
      scrollMode="content"
      sidebar={<DashboardSidebar basePath="" pathname={pathname} onNavigate={onNavigate} />}
      sidebarCollapsible="icon"
      sidebarVariant="sidebar"
    >
      {children}
    </AppLayout>
  );
}

"use client";

import type { ReactNode } from "react";

import { AppLayout } from "@heroui-pro/react";
import { useCallback } from "react";

import { DashboardSidebar } from "./dashboard-sidebar";

export interface AppShellProps {
  children: ReactNode;
  pathname: string;
  onNavigate: (href: string) => void;
}

export function AppShell({ children, onNavigate, pathname }: AppShellProps) {
  const navigate = useCallback((href: string) => onNavigate(href), [onNavigate]);

  return (
    <AppLayout
      className="h-full min-h-0"
      navigate={navigate}
      scrollMode="content"
      sidebar={<DashboardSidebar basePath="" pathname={pathname} />}
      sidebarCollapsible="icon"
      sidebarVariant="sidebar"
    >
      {children}
    </AppLayout>
  );
}

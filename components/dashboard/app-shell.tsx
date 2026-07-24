"use client";

import { AppLayout } from "@heroui-pro/react";
import type { ReactNode } from "react";
import { useCallback } from "react";

import { DashboardSidebar } from "./dashboard-sidebar";

export interface AppShellProps {
  children: ReactNode;
  pathname: string;
  onNavigate: (href: string) => void;
}

export function AppShell({ children, pathname, onNavigate }: AppShellProps) {
  const navigate = useCallback((href: string) => onNavigate(href), [onNavigate]);

  return (
    <AppLayout
      scrollMode="content"
      sidebarVariant="floating"
      navigate={navigate}
      sidebar={<DashboardSidebar basePath="" pathname={pathname} />}
    >
      {children}
    </AppLayout>
  );
}

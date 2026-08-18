"use client";

import { Tooltip } from "@heroui/react";
import { AppLayout, Navbar, Sidebar } from "@heroui-pro/react";
import type { ReactNode } from "react";
import { useCallback } from "react";

import { DashboardSidebar } from "./dashboard-sidebar";
import { NAV_GROUPS } from "./nav-items";

export interface AppShellProps {
  children: ReactNode;
  pathname: string;
  onNavigate: (href: string) => void;
}

export function AppShell({ children, pathname, onNavigate }: AppShellProps) {
  const navigate = useCallback((href: string) => onNavigate(href), [onNavigate]);
  const pageLabel =
    NAV_GROUPS.flatMap((group) => group.items).find((item) => item.href === pathname)?.label ??
    "Dashboard";

  return (
    <AppLayout
      scrollMode="content"
      sidebarCollapsible="icon"
      sidebarVariant="floating"
      navigate={navigate}
      navbar={
        <Navbar maxWidth="full">
          <Navbar.Header>
            <AppLayout.MenuToggle aria-label="Open navigation" tooltip="Open navigation" />
            <Tooltip delay={0}>
              <Tooltip.Trigger aria-label="Toggle sidebar">
                <Sidebar.Trigger aria-label="Toggle sidebar" />
              </Tooltip.Trigger>
              <Tooltip.Content>Toggle sidebar</Tooltip.Content>
            </Tooltip>
            <span className="text-foreground min-w-0 truncate text-sm font-semibold">
              {pageLabel}
            </span>
          </Navbar.Header>
        </Navbar>
      }
      sidebar={<DashboardSidebar basePath="" pathname={pathname} />}
    >
      {children}
    </AppLayout>
  );
}

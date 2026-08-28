"use client";

import { Breadcrumbs, Tooltip } from "@heroui/react";
import { House } from "@gravity-ui/icons";
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
            <Breadcrumbs aria-label="Current location" className="min-w-0">
              <Breadcrumbs.Item className="min-w-0 font-semibold">
                <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                  <House aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{pageLabel}</span>
                </span>
              </Breadcrumbs.Item>
            </Breadcrumbs>
          </Navbar.Header>
        </Navbar>
      }
      sidebar={<DashboardSidebar basePath="" pathname={pathname} />}
    >
      {children}
    </AppLayout>
  );
}

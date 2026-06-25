"use client";

import React, { useState } from "react";
import { Sheet } from "@heroui-pro/react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsDashboardOpen, toggleDashboard } from "@/lib/features/ui";
import { selectIsAdmin } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

import { AppShell } from "./app-shell";
import { DashboardPage } from "./views/dashboard-page";
import { AnalyticsPage } from "./views/analytics-page";
import { OrdersPage } from "./views/orders-page";
import { UsersPage } from "./views/users-page";
import { PermissionsPage } from "./views/permissions-page";
import { TrackerPage } from "./views/tracker-page";
import { SettingsPage } from "./views/settings-page";
import { HelpPage } from "./views/help-page";
import { CategoriesPage } from "./views/categories-page";
import { TagsPage } from "./views/tags-page";

export function DashboardSheet() {
  const isMounted = useMounted();
  const isOpen = useAppSelector(selectIsDashboardOpen);
  const isAdmin = useAppSelector(selectIsAdmin);
  const dispatch = useAppDispatch();

  // Internal routing state for the Dashboard overlay
  const [currentPath, setCurrentPath] = useState("/");

  const handleOpenChange = () => {
    dispatch(toggleDashboard());
  };

  if (!isMounted || !isAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (currentPath) {
      case "/":
        return <DashboardPage />;
      case "/categories":
        return <CategoriesPage />;
      case "/tags":
        return <TagsPage />;
      case "/analytics":
        return <AnalyticsPage />;
      case "/orders":
        return <OrdersPage />;
      case "/users":
        return <UsersPage />;
      case "/permissions":
        return <PermissionsPage />;
      case "/tracker":
        return <TrackerPage />;
      case "/settings":
        return <SettingsPage />;
      case "/help":
        return <HelpPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange} isDetached>
      <Sheet.Backdrop variant="blur">
        <Sheet.Content>
          <Sheet.Dialog id="dashboard-sheet-container">
            <Sheet.Handle />
            <AppShell pathname={currentPath} onNavigate={setCurrentPath}>
              {renderContent()}
            </AppShell>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}

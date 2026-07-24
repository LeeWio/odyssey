"use client";

import { Sheet } from "@heroui-pro/react";
import { useMounted } from "@mantine/hooks";
import { useState } from "react";
import { selectIsAdmin } from "@/lib/features/auth";
import { selectIsDashboardOpen, toggleDashboard } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import { AppShell } from "./app-shell";
import { AnalyticsPage } from "./views/analytics-page";
import { CategoriesPage } from "./views/categories-page";
import { CommentsPage } from "./views/comments-page";
import { DashboardPage } from "./views/dashboard-page";
import { FilesPage } from "./views/files-page";
import { HelpPage } from "./views/help-page";
import { MomentsPage } from "./views/moments-page";
import { OrdersPage } from "./views/orders-page";
import { PermissionsPage } from "./views/permissions-page";
import { SettingsPage } from "./views/settings-page";
import { TagsPage } from "./views/tags-page";
import { TrackerPage } from "./views/tracker-page";
import { UsersPage } from "./views/users-page";

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
      case "/comments":
        return <CommentsPage />;
      case "/moments":
        return <MomentsPage />;
      case "/files":
        return <FilesPage />;
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

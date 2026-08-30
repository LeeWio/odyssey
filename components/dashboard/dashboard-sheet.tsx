"use client";

import { Sheet } from "@heroui-pro/react";
import { useMounted } from "@mantine/hooks";
import { useState } from "react";
import { selectIsAdmin } from "@/lib/features/auth";
import { selectIsDashboardOpen, toggleDashboard } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import { AppShell } from "./app-shell";
import { AccessPlaceholderPage } from "./views/access-placeholder-page";
import { AnalyticsPage } from "./views/analytics-page";
import { AudiencePage } from "./views/audience-page";
import { CategoriesPage } from "./views/categories-page";
import { CommentsPage } from "./views/comments-page";
import { ColumnsPage } from "./views/columns-page";
import { DashboardPage } from "./views/dashboard-page";
import { FilesPage } from "./views/files-page";
import { FriendLinksPage } from "./views/friend-links-page";
import { HelpPage } from "./views/help-page";
import { MomentsPage } from "./views/moments-page";
import { OrdersPage } from "./views/orders-page";
import { PermissionsPage } from "./views/permissions-page";
import { PostsPage } from "./views/posts-page";
import { SettingsPage } from "./views/settings-page";
import { EditorialCalendarPage } from "./views/editorial-calendar-page";
import { RolesPage } from "./views/roles-page";
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
      case "/posts":
        return <PostsPage />;
      case "/columns":
        return <ColumnsPage />;
      case "/links":
        return <FriendLinksPage />;
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
      case "/schedule":
        return <EditorialCalendarPage />;
      case "/orders":
        return <OrdersPage />;
      case "/users":
        return <UsersPage />;
      case "/audience":
        return <AudiencePage />;
      case "/groups":
        return (
          <AccessPlaceholderPage
            title="User Groups"
            description="Organize members across departments, teams, and temporary collaborations."
          />
        );
      case "/roles":
        return <RolesPage />;
      case "/permissions":
        return <PermissionsPage />;
      case "/access-policies":
        return (
          <AccessPlaceholderPage
            title="Access Policies"
            description="Define security requirements for sign-in, sessions, devices, and network access."
          />
        );
      case "/service-accounts":
        return (
          <AccessPlaceholderPage
            title="Service Accounts"
            description="Manage non-human identities and the scoped access they use for automation."
          />
        );
      case "/audit-logs":
        return (
          <AccessPlaceholderPage
            title="Audit Logs"
            description="Review administrative activity, permission changes, and security events."
          />
        );
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
          <Sheet.Dialog id="dashboard-sheet-container" aria-label="Dashboard Overlay">
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

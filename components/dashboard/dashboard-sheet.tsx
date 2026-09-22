"use client";

import { Sheet } from "@heroui-pro/react";
import { Spinner } from "@heroui/react";
import { useMounted } from "@mantine/hooks";
import { lazy, Suspense, useState } from "react";
import { selectIsAdmin, useLogoutMutation } from "@/lib/features/auth";
import { selectIsDashboardOpen, toggleDashboard } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import { AppShell } from "./app-shell";

function ViewFallback() {
  return (
    <div className="flex min-h-64 w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

const DashboardPage = lazy(() =>
  import("./views/dashboard-page").then((mod) => ({ default: mod.DashboardPage }))
);
const PostsPage = lazy(() =>
  import("./views/posts-page").then((mod) => ({ default: mod.PostsPage }))
);
const ColumnsPage = lazy(() =>
  import("./views/columns-page").then((mod) => ({ default: mod.ColumnsPage }))
);
const FriendLinksPage = lazy(() =>
  import("./views/friend-links-page").then((mod) => ({ default: mod.FriendLinksPage }))
);
const CategoriesPage = lazy(() =>
  import("./views/categories-page").then((mod) => ({ default: mod.CategoriesPage }))
);
const TagsPage = lazy(() => import("./views/tags-page").then((mod) => ({ default: mod.TagsPage })));
const CommentsPage = lazy(() =>
  import("./views/comments-page").then((mod) => ({ default: mod.CommentsPage }))
);
const MomentsPage = lazy(() =>
  import("./views/moments-page").then((mod) => ({ default: mod.MomentsPage }))
);
const FilesPage = lazy(() =>
  import("./views/files-page").then((mod) => ({ default: mod.FilesPage }))
);
const AnalyticsPage = lazy(() =>
  import("./views/analytics-page").then((mod) => ({ default: mod.AnalyticsPage }))
);
const EditorialCalendarPage = lazy(() =>
  import("./views/editorial-calendar-page").then((mod) => ({
    default: mod.EditorialCalendarPage,
  }))
);
const OrdersPage = lazy(() =>
  import("./views/orders-page").then((mod) => ({ default: mod.OrdersPage }))
);
const UsersPage = lazy(() =>
  import("./views/users-page").then((mod) => ({ default: mod.UsersPage }))
);
const AudiencePage = lazy(() =>
  import("./views/audience-page").then((mod) => ({ default: mod.AudiencePage }))
);
const RolesPage = lazy(() =>
  import("./views/roles-page").then((mod) => ({ default: mod.RolesPage }))
);
const PermissionsPage = lazy(() =>
  import("./views/permissions-page").then((mod) => ({ default: mod.PermissionsPage }))
);
const TrackerPage = lazy(() =>
  import("./views/tracker-page").then((mod) => ({ default: mod.TrackerPage }))
);
const SettingsPage = lazy(() =>
  import("./views/settings-page").then((mod) => ({ default: mod.SettingsPage }))
);
const HelpPage = lazy(() => import("./views/help-page").then((mod) => ({ default: mod.HelpPage })));
const AccessPlaceholderPage = lazy(() =>
  import("./views/access-placeholder-page").then((mod) => ({
    default: mod.AccessPlaceholderPage,
  }))
);

export function DashboardSheet() {
  const isMounted = useMounted();
  const isOpen = useAppSelector(selectIsDashboardOpen);
  const isAdmin = useAppSelector(selectIsAdmin);
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  const [currentPath, setCurrentPath] = useState("/");

  const handleOpenChange = () => {
    dispatch(toggleDashboard());
  };

  const handleNavigate = (href: string) => {
    if (href === "/logout") {
      void logout();
      dispatch(toggleDashboard());
      return;
    }

    setCurrentPath(href);
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
            <AppShell pathname={currentPath} onNavigate={handleNavigate}>
              <Suspense fallback={<ViewFallback />}>{renderContent()}</Suspense>
            </AppShell>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}

"use client";

import { Xmark } from "@gravity-ui/icons";
import { Sheet } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { LifeListItemResponse, LifeListStatus } from "@/lib/features/life-list";
import { selectIsAdmin, useLogoutMutation } from "@/lib/features/auth";
import {
  selectDashboardPath,
  selectIsDashboardOpen,
  openDashboardAtPath,
  setDashboardOpen,
  setDashboardPath,
  toggleDashboard,
} from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useQueryState } from "@/lib/hooks/use-query-state";

import { AppShell } from "./app-shell";
import { NAV_ITEMS } from "./nav-items";
import { AccessPlaceholderPage } from "./views/access-placeholder-page";
import { AnalyticsPage } from "./views/analytics-page";
import { AudiencePage } from "./views/audience-page";
import { AuditLogsPage } from "./views/audit-logs-page";
import { BrokenLinksPage } from "./views/broken-links-page";
import { CategoriesPage } from "./views/categories-page";
import { ColumnsPage } from "./views/columns-page";
import { CommentsPage } from "./views/comments-page";
import { DashboardPage } from "./views/dashboard-page";
import { EditorialCalendarPage } from "./views/editorial-calendar-page";
import { FilesPage } from "./views/files-page";
import { FriendLinksPage } from "./views/friend-links-page";
import { HelpPage } from "./views/help-page";
import { LifeListAdminPage, LifeListNestedSheets } from "./views/life-list-page";
import { MomentsPage } from "./views/moments-page";
import { NotificationDeliveriesPage } from "./views/notification-deliveries-page";
import { OrdersPage } from "./views/orders-page";
import { PermissionsPage } from "./views/permissions-page";
import { PostsPage } from "./views/posts-page";
import { RolesPage } from "./views/roles-page";
import { SettingsPage } from "./views/settings-page";
import { TagsPage } from "./views/tags-page";
import { TrackerPage } from "./views/tracker-page";
import { UsersPage } from "./views/users-page";
import { WebhooksPage } from "./views/webhooks-page";

const DASHBOARD_PATHS = new Set(NAV_ITEMS.map((item) => item.href));

export function DashboardSheet() {
  const isOpen = useAppSelector(selectIsDashboardOpen);
  const requestedPath = useAppSelector(selectDashboardPath);
  const isAdmin = useAppSelector(selectIsAdmin);
  const dispatch = useAppDispatch();
  const { searchParams, updateQuery } = useQueryState();
  const [logout] = useLogoutMutation();
  const t = useTranslations("Dashboard");
  const currentPath = requestedPath;
  const [lifeListItem, setLifeListItem] = useState<LifeListItemResponse | null>(null);
  const [createWishOpen, setCreateWishOpen] = useState(false);
  const [createWishStatus, setCreateWishStatus] = useState<LifeListStatus>("planned");
  const [suppressOutsideClose, setSuppressOutsideClose] = useState(false);
  const hasHydratedUrlRef = useRef(false);
  const lastDashboardParamRef = useRef<string | null>(null);

  const dashboardParam = searchParams.get("dashboard");

  useEffect(() => {
    if (!isAdmin) return;

    if (!hasHydratedUrlRef.current) {
      hasHydratedUrlRef.current = true;
      lastDashboardParamRef.current = dashboardParam;
      if (dashboardParam && DASHBOARD_PATHS.has(dashboardParam)) {
        dispatch(openDashboardAtPath(dashboardParam));
      }
      return;
    }

    if (dashboardParam === lastDashboardParamRef.current) return;
    lastDashboardParamRef.current = dashboardParam;

    if (dashboardParam && DASHBOARD_PATHS.has(dashboardParam)) {
      dispatch(openDashboardAtPath(dashboardParam));
    } else {
      dispatch(setDashboardOpen(false));
    }
  }, [dashboardParam, dispatch, isAdmin]);

  const handleOpenChange = (open: boolean) => {
    // The press that opens a nested sheet is also reported as an outside close.
    // Ignore only that event. Backdrop and drag closes still dismiss the dashboard.
    if (!open && suppressOutsideClose) {
      setSuppressOutsideClose(false);
      return;
    }
    updateQuery({ dashboard: open ? currentPath : null }, { mode: open ? "push" : "replace" });
    dispatch(setDashboardOpen(open));
  };

  const openWish = (item: LifeListItemResponse) => {
    setSuppressOutsideClose(true);
    setLifeListItem(item);
  };

  const handleNavigate = (href: string) => {
    if (href === "/logout") {
      void logout();
      dispatch(toggleDashboard());
      return;
    }

    dispatch(setDashboardPath(href));
    updateQuery({ dashboard: href }, { mode: "push" });
  };

  if (!isAdmin) {
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
      case "/broken-links":
        return <BrokenLinksPage />;
      case "/categories":
        return <CategoriesPage />;
      case "/tags":
        return <TagsPage />;
      case "/comments":
        return <CommentsPage />;
      case "/moments":
        return <MomentsPage />;
      case "/life-list":
        return (
          <LifeListAdminPage
            onCreate={(status) => {
              setCreateWishStatus(status);
              setCreateWishOpen(true);
            }}
            onOpen={openWish}
          />
        );
      case "/files":
        return <FilesPage />;
      case "/analytics":
        return <AnalyticsPage />;
      case "/schedule":
        return <EditorialCalendarPage />;
      case "/orders":
        return <OrdersPage onOpenAudience={() => handleNavigate("/audience")} />;
      case "/users":
        return <UsersPage />;
      case "/audience":
        return <AudiencePage />;
      case "/groups":
        return (
          <AccessPlaceholderPage
            title={t("placeholders.userGroups")}
            description={t("placeholders.notConnectedDescription", {
              title: t("placeholders.userGroups"),
            })}
          />
        );
      case "/roles":
        return <RolesPage />;
      case "/permissions":
        return <PermissionsPage />;
      case "/access-policies":
        return (
          <AccessPlaceholderPage
            title={t("placeholders.accessPolicies")}
            description={t("placeholders.notConnectedDescription", {
              title: t("placeholders.accessPolicies"),
            })}
          />
        );
      case "/service-accounts":
        return (
          <AccessPlaceholderPage
            title={t("placeholders.serviceAccounts")}
            description={t("placeholders.notConnectedDescription", {
              title: t("placeholders.serviceAccounts"),
            })}
          />
        );
      case "/audit-logs":
        return <AuditLogsPage />;
      case "/tracker":
        return <TrackerPage />;
      case "/settings":
        return <SettingsPage />;
      case "/webhooks":
        return <WebhooksPage />;
      case "/notification-deliveries":
        return <NotificationDeliveriesPage />;
      case "/help":
        return <HelpPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange} isDetached>
      <Sheet.Backdrop isExiting variant="blur">
        <Sheet.Content>
          <>
            <Sheet.Dialog id="dashboard-sheet-container" aria-label={t("shell.dashboardOverlay")}>
              <Sheet.Handle />
              <Sheet.CloseTrigger aria-label={t("shell.closeDashboard")} className="z-20">
                <Xmark className="size-4" />
              </Sheet.CloseTrigger>
              <AppShell pathname={currentPath} onNavigate={handleNavigate}>
                {renderContent()}
              </AppShell>
              {currentPath === "/life-list" ? (
                <LifeListNestedSheets
                  item={lifeListItem}
                  onItemOpenChange={(open) => {
                    if (!open) {
                      setSuppressOutsideClose(false);
                      setLifeListItem(null);
                    }
                  }}
                />
              ) : null}
            </Sheet.Dialog>
          </>
        </Sheet.Content>
      </Sheet.Backdrop>
      {currentPath === "/life-list" ? (
        <LifeListNestedSheets
          createOnly
          createOpen={createWishOpen}
          createStatus={createWishStatus}
          item={null}
          onCreateOpenChange={setCreateWishOpen}
          onCreateStatusChange={setCreateWishStatus}
          onCreated={(item) => {
            setSuppressOutsideClose(true);
            setCreateWishOpen(false);
            setLifeListItem(item);
          }}
          onItemOpenChange={() => undefined}
        />
      ) : null}
    </Sheet>
  );
}

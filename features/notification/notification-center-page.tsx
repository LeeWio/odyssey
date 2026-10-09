"use client";

import { EmptyState } from "@heroui-pro/react";
import { AlertDialog, Button, Card, Chip, Tabs, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  type NotificationCategory,
  type NotificationResponse,
  type NotificationView,
  useClearReadNotificationsMutation,
  useDeleteNotificationMutation,
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsDoneMutation,
  useMarkNotificationAsReadMutation,
  useReopenNotificationMutation,
  useSetNotificationSavedMutation,
} from "@/lib/features/notification";
import { getNotificationDestination } from "@/lib/notification-presentation";
import { openDashboardAtPath, setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { NotificationCategoryFilter } from "./notification-category-filter";
import { NotificationCategoryList } from "./notification-category-list";
import { useNotificationActions } from "./use-notification-actions";

const NOTIFICATIONS_PAGE_SIZE = 20;

function NotificationSkeleton() {
  const t = useTranslations("Notifications");
  return (
    <div aria-busy="true" aria-label={t("loading")} className="space-y-3" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <Card key={index} variant="secondary">
          <Card.Header>
            <div className="bg-default-200 h-4 w-24 animate-pulse rounded" />
            <div className="bg-default-200 h-5 w-2/3 animate-pulse rounded" />
          </Card.Header>
          <Card.Content>
            <div className="bg-default-200 h-4 w-full animate-pulse rounded" />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

function NotificationEmptyState({
  category,
  unreadOnly,
  view,
}: {
  category?: NotificationCategory;
  unreadOnly: boolean;
  view: NotificationView;
}) {
  const t = useTranslations("Notifications");
  const categoryLabel = category ? t(`category.${category}`) : undefined;
  const title = categoryLabel
    ? unreadOnly
      ? t("emptyCategoryUnread", { category: categoryLabel })
      : t("emptyCategoryTitle", { category: categoryLabel })
    : {
        inbox: t("emptyInboxTitle"),
        saved: t("emptySavedTitle"),
        done: t("emptyDoneTitle"),
      }[view];
  const description = categoryLabel
    ? t("emptyCategoryDescription")
    : {
        inbox: t("emptyInboxDescription"),
        saved: t("emptySavedDescription"),
        done: t("emptyDoneDescription"),
      }[view];
  return (
    <EmptyState size="md">
      <EmptyState.Header>
        <EmptyState.Media variant="icon">
          <Icon className="text-default-400" icon="solar:bell-off-linear" width={40} />
        </EmptyState.Media>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{description}</EmptyState.Description>
      </EmptyState.Header>
    </EmptyState>
  );
}

export function NotificationCenterPage() {
  const t = useTranslations("Notifications");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [view, setView] = useState<NotificationView>("inbox");
  const [category, setCategory] = useState<NotificationCategory>();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const { pendingActions, pendingBulkAction, run, runBulk, isBulkRunning } =
    useNotificationActions();
  const isClearingRead = pendingBulkAction === "clear-read";
  const isMarkingAllRead = pendingBulkAction === "read-all";
  const isBulkDisabled = pendingBulkAction !== null || pendingActions.size > 0;
  const [isClearReadOpen, setIsClearReadOpen] = useState(false);
  const { data: unreadNotificationCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthenticated,
  });

  const notifications = useGetMyNotificationsQuery(
    {
      page,
      size: NOTIFICATIONS_PAGE_SIZE,
      sort: ["createdAt,desc"],
      view,
      category,
      unreadOnly,
    },
    { skip: !isAuthenticated }
  );
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [markNotificationAsDone] = useMarkNotificationAsDoneMutation();
  const [reopenNotification] = useReopenNotificationMutation();
  const [setNotificationSaved] = useSetNotificationSavedMutation();
  const [clearReadNotifications] = useClearReadNotificationsMutation();

  const currentPage = notifications.currentData;
  const notificationEntries = currentPage?.list ?? [];
  const lastPage = Math.max(0, (currentPage?.totalPages ?? 1) - 1);
  const isAdjustingPage =
    notifications.isSuccess && !notifications.isFetching && !!currentPage && page > lastPage;
  // Removing the last row can shrink the collection below the current page.
  // Adjust only after a successful response for these exact query arguments.
  if (isAdjustingPage) setPage(lastPage);
  const isLoadingPage =
    isAdjustingPage || notifications.isLoading || (notifications.isFetching && !currentPage);

  const navigateToNotification = (notification: NotificationResponse) => {
    const destination = getNotificationDestination(notification);
    if (!destination) return;

    if (destination.kind === "dashboard") {
      dispatch(openDashboardAtPath(destination.path));
    } else if (destination.kind === "reader") {
      router.push(destination.href);
    } else {
      window.open(destination.href, "_blank", "noopener,noreferrer");
    }
  };

  const handleNotificationPress = async (notification: NotificationResponse) => {
    await run(notification.id, "read", async () => {
      if (!notification.read) await markNotificationAsRead(notification.id).unwrap();
      navigateToNotification(notification);
    });
  };

  const handleMarkAllRead = () => runBulk("read-all", () => markAllNotificationsAsRead().unwrap());

  const handleDeleteNotification = (id: number) =>
    run(id, "delete", () => deleteNotification(id).unwrap());

  const handleSaveNotification = (notification: NotificationResponse) =>
    run(notification.id, "save", () =>
      setNotificationSaved({ id: notification.id, saved: !notification.saved }).unwrap()
    );

  const handleCompleteNotification = (id: number) =>
    run(id, "complete", () => markNotificationAsDone(id).unwrap());

  const handleReopenNotification = (id: number) =>
    run(id, "reopen", () => reopenNotification(id).unwrap());

  const handleClearReadNotifications = () =>
    runBulk("clear-read", async () => {
      await clearReadNotifications().unwrap();
      setPage(0);
      setIsClearReadOpen(false);
    });

  if (!isAuthenticated) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-lg">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="gravity-ui:bell" aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>{t("signInTitle")}</EmptyState.Title>
              <EmptyState.Description>{t("signInDescription")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>{t("signIn")}</Button>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <Icon icon="gravity-ui:bell" aria-hidden="true" className="size-4" />
              {t("eyebrow")}
            </div>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              {t("title")}
            </Typography>
            <Typography color="muted" type="body" className="mt-5">
              {t("description")}
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              aria-label={t("unreadTab")}
              aria-pressed={unreadOnly}
              size="sm"
              variant={unreadOnly ? "secondary" : "ghost"}
              onPress={() => {
                setUnreadOnly((current) => !current);
                setPage(0);
              }}
            >
              {t("unreadTab")}
              {unreadNotificationCount > 0 ? (
                <Chip color="accent" size="sm" variant="soft">
                  <span aria-hidden="true">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                </Chip>
              ) : null}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => router.push("/notifications/settings")}
            >
              {t("preferences")}
            </Button>
            <Button
              isDisabled={unreadNotificationCount === 0 || isBulkDisabled}
              isPending={isMarkingAllRead}
              size="sm"
              variant="secondary"
              onPress={handleMarkAllRead}
            >
              <Icon icon="gravity-ui:check" aria-hidden="true" className="size-4" />
              {t("markAllRead")}
            </Button>
            <Button
              isDisabled={isBulkDisabled}
              size="sm"
              variant="ghost"
              onPress={() => setIsClearReadOpen(true)}
            >
              <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-4" />
              {t("clearRead")}
            </Button>
          </div>
        </header>

        <Tabs
          selectedKey={view}
          onSelectionChange={(key) => {
            setView(key === "saved" || key === "done" ? key : "inbox");
            setPage(0);
          }}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label={t("views")}>
              <Tabs.Tab id="inbox">
                {t("inbox")}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="saved">
                {t("saved")}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="done">
                {t("done")}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        <div className="mt-4">
          <NotificationCategoryFilter
            category={category}
            onCategoryChange={(next) => {
              setCategory(next);
              setPage(0);
            }}
          />
        </div>

        <section aria-live="polite" className="mt-6">
          {isLoadingPage ? (
            <NotificationSkeleton />
          ) : notifications.isError ? (
            <Card variant="secondary">
              <Card.Header>
                <Card.Title>{t("unavailable")}</Card.Title>
                <Card.Description>{t("tryAgainHint")}</Card.Description>
              </Card.Header>
              <Card.Footer>
                <Button size="sm" variant="secondary" onPress={() => notifications.refetch()}>
                  {t("tryAgain")}
                </Button>
              </Card.Footer>
            </Card>
          ) : notificationEntries.length === 0 ? (
            <NotificationEmptyState category={category} unreadOnly={unreadOnly} view={view} />
          ) : (
            <NotificationCategoryList
              category={category}
              disabled={pendingBulkAction !== null}
              notifications={notificationEntries}
              pendingActions={pendingActions}
              showInboxActions
              view={view}
              onComplete={handleCompleteNotification}
              onDelete={handleDeleteNotification}
              onOpen={handleNotificationPress}
              onReopen={handleReopenNotification}
              onSave={handleSaveNotification}
            />
          )}
        </section>

        {page > 0 || (currentPage && currentPage.totalPages > 1) ? (
          <div className="mt-6 flex items-center justify-between gap-4">
            <Typography color="muted" type="body-xs">
              {currentPage
                ? t("pageOf", { page: page + 1, pages: currentPage.totalPages })
                : t("pageNumber", { page: page + 1 })}
            </Typography>
            <div className="flex gap-2">
              <Button
                isDisabled={page === 0 || notifications.isFetching}
                size="sm"
                variant="secondary"
                onPress={() => setPage((current) => Math.max(0, current - 1))}
              >
                {t("previous")}
              </Button>
              <Button
                isDisabled={notifications.isFetching || !currentPage || page >= lastPage}
                size="sm"
                variant="secondary"
                onPress={() => setPage((current) => current + 1)}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isClearReadOpen}
          isDismissable={false}
          isKeyboardDismissDisabled={isClearingRead}
          onOpenChange={(open) => {
            if (!isBulkRunning()) setIsClearReadOpen(open);
          }}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger isDisabled={isClearingRead} />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>{t("clearTitle")}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">{t("clearHint")}</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button isDisabled={isClearingRead} slot="close" size="sm" variant="tertiary">
                  {t("cancel")}
                </Button>
                <Button
                  isPending={isClearingRead}
                  isDisabled={isBulkDisabled}
                  size="sm"
                  variant="danger"
                  onPress={handleClearReadNotifications}
                >
                  {t("clearConfirm")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

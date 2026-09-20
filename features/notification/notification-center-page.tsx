"use client";

import { EmptyState } from "@heroui-pro/react";
import { AlertDialog, Button, Card, Chip, Tabs, Tooltip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import {
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
import {
  formatNotificationDate,
  getNotificationIcon,
  getNotificationTypeLabel,
} from "@/lib/notification-presentation";
import { useRelativeTime } from "@/lib/relative-time";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useNotificationActions } from "./use-notification-actions";

const NOTIFICATIONS_PAGE_SIZE = 20;

function NotificationSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading notifications" className="space-y-3" role="status">
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

function NotificationEmptyState({ view }: { view: NotificationView }) {
  const title = {
    inbox: "No notifications yet",
    saved: "No saved notifications",
    done: "No completed notifications",
  }[view];
  const description = {
    inbox: "Updates about your account and writing will appear here.",
    saved: "Save a notification to keep it here for later.",
    done: "Notifications you mark done will appear here.",
  }[view];
  return (
    <EmptyState size="md">
      <EmptyState.Header>
        <EmptyState.Media variant="icon">
          <Icon className="text-default-400" icon="solar:bell-off-linear" width={40} />
        </EmptyState.Media>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description className="max-w-xs text-pretty">
          {description}
        </EmptyState.Description>
      </EmptyState.Header>
    </EmptyState>
  );
}

export function NotificationCenterPage() {
  const formatRelativeTime = useRelativeTime();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [view, setView] = useState<NotificationView>("inbox");
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
    const link = notification.link?.trim();
    if (!link) return;

    if (link.startsWith("/")) {
      router.push(link);
      return;
    }

    if (/^https?:\/\//i.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
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
              <EmptyState.Title>Your notifications</EmptyState.Title>
              <EmptyState.Description>
                Sign in to keep up with activity around your writing and account.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>Sign in</Button>
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
              Activity inbox
            </div>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              Notifications
            </Typography>
            <Typography color="muted" type="body" className="mt-5">
              Updates that need your attention, all in one place.
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => router.push("/notifications/settings")}
            >
              Preferences
            </Button>
            <Button
              isDisabled={unreadNotificationCount === 0 || isBulkDisabled}
              isPending={isMarkingAllRead}
              size="sm"
              variant="secondary"
              onPress={handleMarkAllRead}
            >
              <Icon icon="gravity-ui:check" aria-hidden="true" className="size-4" />
              Mark all read
            </Button>
            <Button
              isDisabled={isBulkDisabled}
              size="sm"
              variant="ghost"
              onPress={() => setIsClearReadOpen(true)}
            >
              <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-4" />
              Clear read
            </Button>
          </div>
        </header>

        <div className="mt-12">
          <Tabs
            selectedKey={view}
            onSelectionChange={(key) => {
              setView(key === "saved" || key === "done" ? key : "inbox");
              setPage(0);
            }}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Notification views">
                <Tabs.Tab id="inbox">
                  Inbox
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="saved">
                  Saved
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="done">
                  Done
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        <section aria-live="polite" className="mt-6">
          {isLoadingPage ? (
            <NotificationSkeleton />
          ) : notifications.isError ? (
            <Card variant="secondary">
              <Card.Header>
                <Card.Title>Notifications are unavailable</Card.Title>
                <Card.Description>Try loading this page again in a moment.</Card.Description>
              </Card.Header>
              <Card.Footer>
                <Button size="sm" variant="secondary" onPress={() => notifications.refetch()}>
                  Try again
                </Button>
              </Card.Footer>
            </Card>
          ) : notificationEntries.length === 0 ? (
            <NotificationEmptyState view={view} />
          ) : (
            <div className="divide-default-200 border-default-200 divide-y border-y">
              {notificationEntries.map((notification) => (
                <article
                  key={notification.id}
                  className={`group flex gap-3 py-5 sm:gap-5 ${
                    notification.read ? "" : "bg-accent/5 -mx-3 px-3 sm:-mx-5 sm:px-5"
                  }`}
                >
                  <div className="bg-default-100 text-muted mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon
                      aria-hidden="true"
                      className="size-4"
                      icon={getNotificationIcon(notification.type)}
                    />
                  </div>
                  <Button
                    fullWidth
                    className="h-auto min-w-0 flex-1 items-start justify-start p-0 text-left"
                    isPending={pendingActions.get(notification.id) === "read"}
                    isDisabled={pendingBulkAction !== null || pendingActions.has(notification.id)}
                    variant="ghost"
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground text-sm font-semibold">
                          {notification.title}
                        </span>
                        {!notification.read ? (
                          <span
                            aria-label="Unread notification"
                            className="bg-accent size-2 rounded-full"
                          />
                        ) : null}
                        <Chip size="sm" variant="soft">
                          {getNotificationTypeLabel(notification.type)}
                        </Chip>
                      </span>
                      <span className="text-muted mt-1.5 block text-sm leading-6 whitespace-pre-wrap">
                        {notification.content}
                      </span>
                      <time
                        className="text-muted mt-2 block text-xs"
                        dateTime={notification.createdAt}
                        title={formatNotificationDate(notification.createdAt)}
                      >
                        {formatRelativeTime(notification.createdAt)}
                      </time>
                    </span>
                  </Button>
                  <div className="flex shrink-0 items-start">
                    <Tooltip>
                      <Button
                        isIconOnly
                        aria-label={notification.saved ? "Remove from saved" : "Save notification"}
                        isPending={pendingActions.get(notification.id) === "save"}
                        isDisabled={
                          pendingBulkAction !== null || pendingActions.has(notification.id)
                        }
                        size="sm"
                        variant="ghost"
                        onPress={() => handleSaveNotification(notification)}
                      >
                        <Icon icon="gravity-ui:bookmark" aria-hidden="true" className="size-4" />
                      </Button>
                      <Tooltip.Content>
                        {notification.saved ? "Remove from saved" : "Save for later"}
                      </Tooltip.Content>
                    </Tooltip>
                    {view !== "done" ? (
                      <Tooltip>
                        <Button
                          isIconOnly
                          aria-label={`Complete notification: ${notification.title}`}
                          isPending={pendingActions.get(notification.id) === "complete"}
                          isDisabled={
                            pendingBulkAction !== null || pendingActions.has(notification.id)
                          }
                          size="sm"
                          variant="ghost"
                          onPress={() => handleCompleteNotification(notification.id)}
                        >
                          <Icon
                            icon="gravity-ui:circle-check"
                            aria-hidden="true"
                            className="size-4"
                          />
                        </Button>
                        <Tooltip.Content>Mark done</Tooltip.Content>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <Button
                          isIconOnly
                          aria-label={`Reopen notification: ${notification.title}`}
                          isPending={pendingActions.get(notification.id) === "reopen"}
                          isDisabled={
                            pendingBulkAction !== null || pendingActions.has(notification.id)
                          }
                          size="sm"
                          variant="ghost"
                          onPress={() => handleReopenNotification(notification.id)}
                        >
                          <Icon
                            icon="gravity-ui:arrow-rotate-left"
                            aria-hidden="true"
                            className="size-4"
                          />
                        </Button>
                        <Tooltip.Content>Return to inbox</Tooltip.Content>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <Button
                        isIconOnly
                        aria-label={`Delete notification: ${notification.title}`}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        isPending={pendingActions.get(notification.id) === "delete"}
                        isDisabled={
                          pendingBulkAction !== null || pendingActions.has(notification.id)
                        }
                        size="sm"
                        variant="ghost"
                        onPress={() => handleDeleteNotification(notification.id)}
                      >
                        <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-4" />
                      </Button>
                      <Tooltip.Content>Delete notification</Tooltip.Content>
                    </Tooltip>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {page > 0 || (currentPage && currentPage.totalPages > 1) ? (
          <div className="mt-6 flex items-center justify-between gap-4">
            <Typography color="muted" type="body-xs">
              {currentPage ? `Page ${page + 1} of ${currentPage.totalPages}` : `Page ${page + 1}`}
            </Typography>
            <div className="flex gap-2">
              <Button
                isDisabled={page === 0 || notifications.isFetching}
                size="sm"
                variant="secondary"
                onPress={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <Button
                isDisabled={notifications.isFetching || !currentPage || page >= lastPage}
                size="sm"
                variant="secondary"
                onPress={() => setPage((current) => current + 1)}
              >
                Next
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
                <AlertDialog.Heading>Clear read notifications?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  This removes read, unsaved notifications from your active inbox. Saved and
                  completed history will remain.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button isDisabled={isClearingRead} slot="close" size="sm" variant="tertiary">
                  Cancel
                </Button>
                <Button
                  isPending={isClearingRead}
                  isDisabled={isBulkDisabled}
                  size="sm"
                  variant="danger"
                  onPress={handleClearReadNotifications}
                >
                  Clear read notifications
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

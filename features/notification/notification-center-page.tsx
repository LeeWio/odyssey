"use client";

import { Bell, Check, TrashBin } from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import { AlertDialog, Button, Card, Chip, Tabs, Tooltip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  type NotificationResponse,
  useClearReadNotificationsMutation,
  useDeleteNotificationMutation,
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "@/lib/features/notification";
import {
  formatNotificationDate,
  getNotificationIcon,
  getNotificationTypeLabel,
} from "@/lib/notification-presentation";
import { formatRelativeTime } from "@/lib/relative-time";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const NOTIFICATIONS_PAGE_SIZE = 20;

function NotificationSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading notifications" className="space-y-3" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <Card key={index} variant="secondary" className="gap-3 p-5">
          <div className="bg-default-200 h-4 w-24 animate-pulse rounded" />
          <div className="bg-default-200 h-5 w-2/3 animate-pulse rounded" />
          <div className="bg-default-200 h-4 w-full animate-pulse rounded" />
        </Card>
      ))}
    </div>
  );
}

function NotificationEmptyState({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <Card variant="secondary" className="p-0">
      <EmptyState size="md">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Bell aria-hidden="true" />
          </EmptyState.Media>
          <EmptyState.Title>
            {unreadOnly ? "You are all caught up" : "No notifications yet"}
          </EmptyState.Title>
          <EmptyState.Description>
            {unreadOnly
              ? "New activity will appear here when it needs your attention."
              : "Updates about your account and writing will appear here."}
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    </Card>
  );
}

export function NotificationCenterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [view, setView] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(0);
  const [notificationPendingRead, setNotificationPendingRead] = useState<number | null>(null);
  const [notificationPendingDeletion, setNotificationPendingDeletion] = useState<number | null>(
    null
  );
  const [isClearReadOpen, setIsClearReadOpen] = useState(false);
  const { data: unreadNotificationCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthenticated,
  });

  const notifications = useGetMyNotificationsQuery(
    {
      page,
      size: NOTIFICATIONS_PAGE_SIZE,
      sort: ["createdAt,desc"],
      unreadOnly: view === "unread",
    },
    { skip: !isAuthenticated }
  );
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsRead, { isLoading: isMarkingAllRead }] =
    useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [clearReadNotifications, { isLoading: isClearingRead }] =
    useClearReadNotificationsMutation();

  const notificationEntries = notifications.data?.list ?? [];

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
    if (!notification.read) {
      setNotificationPendingRead(notification.id);
      try {
        await markNotificationAsRead(notification.id).unwrap();
      } catch {
        // The mutation displays its own failure toast.
        return;
      } finally {
        setNotificationPendingRead(null);
      }
    }

    navigateToNotification(notification);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead().unwrap();
    } catch {
      // The mutation displays its own failure toast.
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    setNotificationPendingDeletion(notificationId);
    try {
      await deleteNotification(notificationId).unwrap();
    } catch {
      // The mutation displays its own failure toast.
    } finally {
      setNotificationPendingDeletion(null);
    }
  };

  const handleClearReadNotifications = async () => {
    try {
      await clearReadNotifications().unwrap();
      setPage(0);
      setIsClearReadOpen(false);
    } catch {
      // The mutation displays its own failure toast.
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-lg">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Bell aria-hidden="true" />
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
              <Bell aria-hidden="true" className="size-4" />
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
              isDisabled={unreadNotificationCount === 0}
              isPending={isMarkingAllRead}
              size="sm"
              variant="secondary"
              onPress={handleMarkAllRead}
            >
              <Check aria-hidden="true" className="size-4" />
              Mark all read
            </Button>
            <Button size="sm" variant="ghost" onPress={() => setIsClearReadOpen(true)}>
              <TrashBin aria-hidden="true" className="size-4" />
              Clear read
            </Button>
          </div>
        </header>

        <div className="mt-12">
          <Tabs
            selectedKey={view}
            onSelectionChange={(key) => {
              setView(key === "unread" ? "unread" : "all");
              setPage(0);
            }}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Notification views">
                <Tabs.Tab id="all">
                  All activity
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="unread">
                  Unread
                  {unreadNotificationCount > 0 ? (
                    <Chip
                      className="h-5 min-w-5 px-1 font-mono text-[10px]"
                      color="accent"
                      size="sm"
                    >
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </Chip>
                  ) : null}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        <section aria-live="polite" className="mt-6">
          {notifications.isLoading ? (
            <NotificationSkeleton />
          ) : notifications.isError ? (
            <Card variant="secondary" className="items-start gap-2 p-7">
              <Card.Header>
                <Card.Title>Notifications are unavailable</Card.Title>
                <Card.Description>Try loading this page again in a moment.</Card.Description>
              </Card.Header>
              <Card.Footer className="p-0">
                <Button size="sm" variant="secondary" onPress={() => notifications.refetch()}>
                  Try again
                </Button>
              </Card.Footer>
            </Card>
          ) : notificationEntries.length === 0 ? (
            <NotificationEmptyState unreadOnly={view === "unread"} />
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
                    isPending={notificationPendingRead === notification.id}
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
                  <Tooltip>
                    <Button
                      isIconOnly
                      aria-label={`Delete notification: ${notification.title}`}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      isPending={notificationPendingDeletion === notification.id}
                      size="sm"
                      variant="ghost"
                      onPress={() => handleDeleteNotification(notification.id)}
                    >
                      <TrashBin aria-hidden="true" className="size-4" />
                    </Button>
                    <Tooltip.Content>Delete notification</Tooltip.Content>
                  </Tooltip>
                </article>
              ))}
            </div>
          )}
        </section>

        {notifications.data && notifications.data.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-4">
            <Typography color="muted" type="body-xs">
              Page {page + 1} of {notifications.data.totalPages}
            </Typography>
            <div className="flex gap-2">
              <Button
                isDisabled={page === 0}
                size="sm"
                variant="secondary"
                onPress={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <Button
                isDisabled={page >= notifications.data.totalPages - 1}
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
          onOpenChange={setIsClearReadOpen}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Clear read notifications?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  This removes read notifications from your inbox. Unread notifications will remain.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" size="sm" variant="tertiary">
                  Cancel
                </Button>
                <Button
                  isPending={isClearingRead}
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

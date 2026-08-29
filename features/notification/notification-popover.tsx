"use client";

import { ArrowRotateLeft, Bell, Check, Eye } from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import {
  Badge,
  Button,
  Card,
  Chip,
  Popover,
  ScrollShadow,
  Skeleton,
  Tabs,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type NotificationResponse,
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "@/lib/features/notification";
import { getNotificationIcon, getNotificationTypeLabel } from "@/lib/notification-presentation";
import { useRelativeTime } from "@/lib/relative-time";

const POPOVER_PAGE_SIZE = 8;

type NotificationView = "all" | "unread";

function NotificationPopoverSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading notifications"
      className="space-y-1 p-2"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex gap-3 rounded-xl p-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationPopoverEmptyState({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <div className="px-6 py-10">
      <EmptyState size="sm">
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
              : "Updates about your writing and account will appear here."}
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    </div>
  );
}

function NotificationItem({
  isPending,
  notification,
  onPress,
}: {
  isPending: boolean;
  notification: NotificationResponse;
  onPress: (notification: NotificationResponse) => void;
}) {
  const formatRelativeTime = useRelativeTime();

  return (
    <li className={notification.read ? "" : "bg-accent/5"}>
      <Button
        fullWidth
        className="h-auto items-start justify-start gap-3 rounded-none px-4 py-3 text-left"
        isPending={isPending}
        variant="ghost"
        onPress={() => onPress(notification)}
      >
        <span className="bg-default text-muted mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon
            aria-hidden="true"
            className="size-4"
            icon={getNotificationIcon(notification.type)}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-foreground line-clamp-1 text-sm font-semibold">
              {notification.title}
            </span>
            {!notification.read ? (
              <span
                aria-label="Unread notification"
                className="bg-accent size-2 shrink-0 rounded-full"
              />
            ) : null}
          </span>
          <span className="text-muted mt-1 line-clamp-2 block text-sm leading-5 whitespace-pre-wrap">
            {notification.content}
          </span>
          <span className="text-muted mt-2 flex items-center gap-2 text-xs">
            <time dateTime={notification.createdAt}>
              {formatRelativeTime(notification.createdAt)}
            </time>
            <Chip size="sm" variant="soft">
              {getNotificationTypeLabel(notification.type)}
            </Chip>
          </span>
        </span>
      </Button>
    </li>
  );
}

export function NotificationPopover() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<NotificationView>("all");
  const [pendingNotificationId, setPendingNotificationId] = useState<number | null>(null);
  const { data: unreadCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 60_000,
  });
  const notifications = useGetMyNotificationsQuery(
    { unreadOnly: view === "unread", page: 0, size: POPOVER_PAGE_SIZE, sort: ["createdAt,desc"] },
    { skip: !isOpen }
  );
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsRead, { isLoading: isMarkingAllRead }] =
    useMarkAllNotificationsAsReadMutation();
  const notificationEntries = notifications.data?.list ?? [];

  const navigateToNotification = (notification: NotificationResponse) => {
    const link = notification.link?.trim();
    if (!link) return;

    if (link.startsWith("/")) {
      router.push(link);
      return;
    }

    if (/^https?:\/\//i.test(link)) window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleNotificationPress = async (notification: NotificationResponse) => {
    if (!notification.read) {
      setPendingNotificationId(notification.id);
      try {
        await markNotificationAsRead(notification.id).unwrap();
      } catch {
        return;
      } finally {
        setPendingNotificationId(null);
      }
    }

    setIsOpen(false);
    navigateToNotification(notification);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead().unwrap();
    } catch {
      // The mutation displays its own failure toast.
    }
  };

  return (
    <Badge.Anchor>
      <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
        <Tooltip delay={500} closeDelay={100}>
          <Button
            isIconOnly
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
            size="sm"
            variant="ghost"
          >
            <Bell aria-hidden="true" className="size-4" />
          </Button>
          <Tooltip.Content placement="bottom" offset={8}>
            Notifications
          </Tooltip.Content>
        </Tooltip>

        <Popover.Content
          isNonModal
          className="w-[min(26rem,calc(100vw-1.5rem))] overflow-hidden p-0"
          placement="bottom end"
        >
          <Popover.Dialog className="p-0 outline-none">
            <Card variant="transparent">
              <Card.Header className="flex-row items-center justify-between gap-3">
                <div className="min-w-0">
                  <Popover.Heading className="text-base font-semibold">
                    Notifications
                  </Popover.Heading>
                  <p className="text-muted mt-1 text-xs">
                    Activity around your writing and account.
                  </p>
                </div>
                <Tooltip>
                  <Button
                    isIconOnly
                    aria-label="Mark all notifications as read"
                    isDisabled={unreadCount === 0}
                    isPending={isMarkingAllRead}
                    size="sm"
                    variant="ghost"
                    onPress={handleMarkAllRead}
                  >
                    <Check aria-hidden="true" className="size-4" />
                  </Button>
                  <Tooltip.Content>Mark all read</Tooltip.Content>
                </Tooltip>
              </Card.Header>

              <Tabs
                selectedKey={view}
                onSelectionChange={(key) => setView(key === "unread" ? "unread" : "all")}
              >
                <Tabs.ListContainer className="px-4">
                  <Tabs.List aria-label="Notification views">
                    <Tabs.Tab id="all">
                      All
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="unread">
                      Unread
                      {unreadCount > 0 ? (
                        <Chip color="accent" size="sm" variant="soft">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Chip>
                      ) : null}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>

              <Card.Content>
                <ScrollShadow className="max-h-96" hideScrollBar>
                  {notifications.isLoading ? <NotificationPopoverSkeleton /> : null}
                  {!notifications.isLoading && notifications.isError ? (
                    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                      <p className="text-muted text-sm">Notifications could not be loaded.</p>
                      <Button size="sm" variant="ghost" onPress={() => notifications.refetch()}>
                        <ArrowRotateLeft aria-hidden="true" className="size-4" />
                        Try again
                      </Button>
                    </div>
                  ) : null}
                  {!notifications.isLoading &&
                  !notifications.isError &&
                  notificationEntries.length === 0 ? (
                    <NotificationPopoverEmptyState unreadOnly={view === "unread"} />
                  ) : null}
                  {!notifications.isLoading &&
                  !notifications.isError &&
                  notificationEntries.length > 0 ? (
                    <ul aria-live="polite" className="divide-default-200 divide-y">
                      {notificationEntries.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          isPending={pendingNotificationId === notification.id}
                          notification={notification}
                          onPress={handleNotificationPress}
                        />
                      ))}
                    </ul>
                  ) : null}
                </ScrollShadow>
              </Card.Content>

              <Card.Footer className="items-center justify-between gap-3">
                <span className="text-muted text-xs">
                  {notifications.data?.total
                    ? `${notifications.data.total.toLocaleString("en-US")} total updates`
                    : "Your activity inbox"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setIsOpen(false);
                    router.push("/notifications");
                  }}
                >
                  <Eye aria-hidden="true" className="size-4" />
                  View all
                </Button>
              </Card.Footer>
            </Card>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {unreadCount > 0 ? (
        <Badge color="danger" placement="top-right" size="sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      ) : null}
    </Badge.Anchor>
  );
}

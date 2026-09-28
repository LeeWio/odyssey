"use client";

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
import { useLocale, useTranslations } from "next-intl";
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
import { useNotificationActions } from "./use-notification-actions";

const POPOVER_PAGE_SIZE = 8;

type NotificationView = "all" | "unread";

function NotificationPopoverSkeleton() {
  const t = useTranslations("Notifications");
  return (
    <div aria-busy="true" aria-label={t("loading")} className="space-y-1 p-2" role="status">
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
  const t = useTranslations("Notifications");
  return (
    <div className="px-6 py-10">
      <EmptyState size="sm">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Icon icon="gravity-ui:bell" aria-hidden="true" />
          </EmptyState.Media>
          <EmptyState.Title>{unreadOnly ? t("caughtUp") : t("emptyInboxTitle")}</EmptyState.Title>
          <EmptyState.Description>
            {unreadOnly ? t("caughtUpHint") : t("popoverEmptyHint")}
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    </div>
  );
}

function NotificationItem({
  isPending,
  isDisabled,
  notification,
  onPress,
}: {
  isPending: boolean;
  isDisabled: boolean;
  notification: NotificationResponse;
  onPress: (notification: NotificationResponse) => void;
}) {
  const t = useTranslations("Notifications");
  const formatRelativeTime = useRelativeTime();

  return (
    <li className={notification.read ? "" : "bg-accent/5"}>
      <Button
        fullWidth
        className="h-auto items-start justify-start gap-3 rounded-none px-4 py-3 text-left"
        isPending={isPending}
        isDisabled={isDisabled}
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
              <span aria-label={t("unread")} className="bg-accent size-2 shrink-0 rounded-full" />
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
              {getNotificationTypeLabel(notification.type, t("typeFallback"))}
            </Chip>
          </span>
        </span>
      </Button>
    </li>
  );
}

export function NotificationPopover() {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<NotificationView>("all");
  const { pendingActions, pendingBulkAction, run, runBulk } = useNotificationActions();
  const { data: unreadCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 60_000,
  });
  const notifications = useGetMyNotificationsQuery(
    { unreadOnly: view === "unread", page: 0, size: POPOVER_PAGE_SIZE, sort: ["createdAt,desc"] },
    { skip: !isOpen }
  );
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsRead] = useMarkAllNotificationsAsReadMutation();
  const currentPage = notifications.currentData;
  const notificationEntries = currentPage?.list ?? [];
  const isLoadingList = notifications.isLoading || (notifications.isFetching && !currentPage);

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
    await run(notification.id, "read", async () => {
      if (!notification.read) await markNotificationAsRead(notification.id).unwrap();
      setIsOpen(false);
      navigateToNotification(notification);
    });
  };

  const handleMarkAllRead = () => runBulk("read-all", () => markAllNotificationsAsRead().unwrap());

  return (
    <Badge.Anchor>
      <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
        <Tooltip delay={500} closeDelay={100}>
          <Button
            isIconOnly
            aria-label={unreadCount > 0 ? t("unreadCount", { count: unreadCount }) : t("title")}
            size="sm"
            variant="ghost"
          >
            <Icon icon="gravity-ui:bell" aria-hidden="true" className="size-4" />
          </Button>
          <Tooltip.Content placement="bottom" offset={8}>
            {t("title")}
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
                    {t("title")}
                  </Popover.Heading>
                  <p className="text-muted mt-1 text-xs">{t("popoverSubtitle")}</p>
                </div>
                <Tooltip>
                  <Button
                    isIconOnly
                    aria-label={t("markAllAria")}
                    isDisabled={
                      unreadCount === 0 || pendingBulkAction !== null || pendingActions.size > 0
                    }
                    isPending={pendingBulkAction === "read-all"}
                    size="sm"
                    variant="ghost"
                    onPress={handleMarkAllRead}
                  >
                    <Icon icon="gravity-ui:check" aria-hidden="true" className="size-4" />
                  </Button>
                  <Tooltip.Content>{t("markAllRead")}</Tooltip.Content>
                </Tooltip>
              </Card.Header>

              <Tabs
                selectedKey={view}
                onSelectionChange={(key) => setView(key === "unread" ? "unread" : "all")}
              >
                <Tabs.ListContainer className="px-4">
                  <Tabs.List aria-label={t("views")}>
                    <Tabs.Tab id="all">
                      {t("all")}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="unread">
                      {t("unreadTab")}
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
                  {isLoadingList ? <NotificationPopoverSkeleton /> : null}
                  {!isLoadingList && notifications.isError ? (
                    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                      <p className="text-muted text-sm">{t("loadFailed")}</p>
                      <Button size="sm" variant="ghost" onPress={() => notifications.refetch()}>
                        <Icon
                          icon="gravity-ui:arrow-rotate-left"
                          aria-hidden="true"
                          className="size-4"
                        />
                        {t("tryAgain")}
                      </Button>
                    </div>
                  ) : null}
                  {!isLoadingList && !notifications.isError && notificationEntries.length === 0 ? (
                    <NotificationPopoverEmptyState unreadOnly={view === "unread"} />
                  ) : null}
                  {!isLoadingList && !notifications.isError && notificationEntries.length > 0 ? (
                    <ul aria-live="polite" className="divide-default-200 divide-y">
                      {notificationEntries.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          isPending={pendingActions.has(notification.id)}
                          isDisabled={
                            pendingBulkAction !== null || pendingActions.has(notification.id)
                          }
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
                  {currentPage?.total
                    ? t("totalUpdates", { count: currentPage.total.toLocaleString(locale) })
                    : t("activityInbox")}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setIsOpen(false);
                    router.push("/notifications");
                  }}
                >
                  <Icon icon="gravity-ui:eye" aria-hidden="true" className="size-4" />
                  {t("viewAll")}
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

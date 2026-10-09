"use client";

import { EmptyState } from "@heroui-pro/react";
import {
  Badge,
  Button,
  Chip,
  Popover,
  ScrollShadow,
  Skeleton,
  Surface,
  Tooltip,
  Typography,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  type NotificationCategory,
  type NotificationResponse,
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "@/lib/features/notification";
import { NotificationCategoryFilter } from "./notification-category-filter";
import { NotificationCategoryList } from "./notification-category-list";
import { getNotificationReaderHref } from "@/lib/notification-presentation";
import { useNotificationActions } from "./use-notification-actions";

const POPOVER_PAGE_SIZE = 8;

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

function NotificationPopoverEmptyState({
  category,
  unreadOnly,
}: {
  category?: NotificationCategory;
  unreadOnly: boolean;
}) {
  const t = useTranslations("Notifications");
  const categoryLabel = category ? t(`category.${category}`) : undefined;
  const title = categoryLabel
    ? unreadOnly
      ? t("emptyCategoryUnread", { category: categoryLabel })
      : t("emptyCategoryTitle", { category: categoryLabel })
    : unreadOnly
      ? t("caughtUp")
      : t("emptyInboxTitle");
  const description = categoryLabel
    ? t("emptyCategoryDescription")
    : unreadOnly
      ? t("caughtUpHint")
      : t("popoverEmptyHint");
  return (
    <EmptyState size="sm">
      <EmptyState.Header>
        <EmptyState.Media variant="icon">
          <Icon icon="gravity-ui:bell" aria-hidden="true" />
        </EmptyState.Media>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{description}</EmptyState.Description>
      </EmptyState.Header>
    </EmptyState>
  );
}

export function NotificationPopover() {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<NotificationCategory>();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { pendingActions, pendingBulkAction, run, runBulk } = useNotificationActions();
  const { data: unreadCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 60_000,
  });
  const notifications = useGetMyNotificationsQuery(
    {
      unreadOnly,
      category,
      page: 0,
      size: POPOVER_PAGE_SIZE,
      sort: ["createdAt,desc"],
    },
    { skip: !isOpen }
  );
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsRead] = useMarkAllNotificationsAsReadMutation();
  const currentPage = notifications.currentData;
  const notificationEntries = currentPage?.list ?? [];
  const isLoadingList = notifications.isLoading || (notifications.isFetching && !currentPage);

  const navigateToNotification = (notification: NotificationResponse) => {
    const link = getNotificationReaderHref(notification.link);
    if (!link) return;

    if (link.startsWith("/")) {
      router.push(link);
      return;
    }

    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleNotificationPress = async (notification: NotificationResponse) => {
    const destination = getNotificationReaderHref(notification.link);
    await run(notification.id, "read", async () => {
      if (!notification.read) await markNotificationAsRead(notification.id).unwrap();
      if (destination) {
        setIsOpen(false);
        navigateToNotification(notification);
      }
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
          className="w-[min(26rem,calc(100vw-1.5rem))] overflow-hidden"
          placement="bottom end"
        >
          <Popover.Dialog className="flex max-h-[min(32rem,80dvh)] flex-col gap-3 overflow-hidden p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Popover.Heading className="text-base font-semibold">{t("title")}</Popover.Heading>
                <Typography className="mt-1" color="muted" type="body-xs">
                  {t("popoverSubtitle")}
                </Typography>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  aria-label={t("unreadTab")}
                  aria-pressed={unreadOnly}
                  size="sm"
                  variant={unreadOnly ? "secondary" : "ghost"}
                  onPress={() => setUnreadOnly((current) => !current)}
                >
                  {t("unreadTab")}
                  {unreadCount > 0 ? (
                    <Chip color="accent" size="sm" variant="soft">
                      <span aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>
                    </Chip>
                  ) : null}
                </Button>
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
              </div>
            </div>
            <NotificationCategoryFilter category={category} onCategoryChange={setCategory} />
            <ScrollShadow className="min-h-48 flex-1" hideScrollBar>
              {isLoadingList ? <NotificationPopoverSkeleton /> : null}
              {!isLoadingList && notifications.isError ? (
                <EmptyState size="sm">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <Icon icon="gravity-ui:bell" aria-hidden="true" />
                    </EmptyState.Media>
                    <EmptyState.Title>{t("loadFailed")}</EmptyState.Title>
                    <EmptyState.Description>{t("tryAgainHint")}</EmptyState.Description>
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <Button size="sm" variant="outline" onPress={() => notifications.refetch()}>
                      {t("tryAgain")}
                    </Button>
                  </EmptyState.Content>
                </EmptyState>
              ) : null}
              {!isLoadingList && !notifications.isError && notificationEntries.length === 0 ? (
                <NotificationPopoverEmptyState category={category} unreadOnly={unreadOnly} />
              ) : null}
              {!isLoadingList && !notifications.isError && notificationEntries.length > 0 ? (
                <NotificationCategoryList
                  category={category}
                  disabled={pendingBulkAction !== null}
                  notifications={notificationEntries}
                  pendingActions={pendingActions}
                  onOpen={handleNotificationPress}
                />
              ) : null}
            </ScrollShadow>
            <Surface className="flex items-center justify-between gap-3 pt-1" variant="transparent">
              <Typography color="muted" type="body-xs">
                {currentPage?.total
                  ? t("totalUpdates", { count: currentPage.total.toLocaleString(locale) })
                  : t("activityInbox")}
              </Typography>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setIsOpen(false);
                    router.push("/notifications/settings");
                  }}
                >
                  {t("preferences")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setIsOpen(false);
                    router.push("/notifications");
                  }}
                >
                  {t("viewAll")}
                </Button>
              </div>
            </Surface>
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

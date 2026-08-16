"use client";

import { ArrowRotateLeft, Bell, Check, Eye } from "@gravity-ui/icons";
import { EmptyState, Segment } from "@heroui-pro/react";
import {
  Card,
  Badge,
  Button,
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
import { formatRelativeTime } from "@/lib/relative-time";

const POPOVER_PAGE_SIZE = 8;

type NotificationView = "all" | "unread";

function NotificationPopoverSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading notifications"
      className="divide-default-200 divide-y"
      role="status"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex gap-3 px-4 py-4">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
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
            : "Updates about your account and writing will appear here."}
        </EmptyState.Description>
      </EmptyState.Header>
    </EmptyState>
  );
}

function NotificationRow({
  isPending,
  notification,
  onPress,
}: {
  isPending: boolean;
  notification: NotificationResponse;
  onPress: (notification: NotificationResponse) => void;
}) {
  return (
    <li className={notification.read ? "" : "bg-accent/5"}>
      <Button
        fullWidth
        className="hover:bg-default/70 h-auto items-start justify-start gap-3 rounded-none px-4 py-4 text-left"
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
            <Chip className="h-5 px-1.5 text-[10px]" size="sm" variant="soft">
              {getNotificationTypeLabel(notification.type)}
            </Chip>
          </span>
        </span>
      </Button>
    </li>
  );
}

type Notification = {
  id: string;
  isRead?: boolean;
  avatar: string;
  description: string;
  name: string;
  time: string;
  type?: "default" | "request" | "file";
};

enum NotificationTabs {
  All = "all",
  Unread = "unread",
  Archive = "archive",
}

const notifications: Record<NotificationTabs, Notification[]> = {
  all: [
    {
      id: "1",
      isRead: false,
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026708c",
      description: "requested to join your Acme organization.",
      name: "Tony Reichert",
      time: "2 hours ago",
      type: "request",
    },
    {
      id: "2",
      isRead: false,
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      description: "modified the Brand logo file.",
      name: "Ben Berman",
      time: "7 hours ago",
      type: "file",
    },
    {
      id: "3",
      isRead: false,
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      description: "liked your post.",
      name: "Jane Doe",
      time: "Yesterday",
    },
    {
      id: "4",
      isRead: true,
      avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
      description: "started following you.",
      name: "John Smith",
      time: "Yesterday",
    },
    {
      id: "5",
      isRead: true,
      avatar: "https://i.pravatar.cc/150?u=a04258a24a2d826712d",
      description: "mentioned you in a post.",
      name: "Jacob Jones",
      time: "2 days ago",
    },
    {
      id: "6",
      isRead: true,
      avatar: "https://i.pravatar.cc/150?u=a04458a24a2d826712d",
      description: "commented on your post.",
      name: "Amelie Dawson",
      time: "4 days ago",
    },
  ],
  unread: [
    {
      id: "1",
      isRead: false,
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026708c",
      description: "requested to join your Acme organization.",
      name: "Tony Reichert",
      time: "2 hours ago",
      type: "request",
    },
    {
      id: "2",
      isRead: false,
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
      description: "modified the Brand logo file.",
      name: "Ben Berman",
      time: "7 hours ago",
      type: "file",
    },
    {
      id: "3",
      isRead: false,
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      description: "liked your post.",
      name: "Jane Doe",
      time: "Yesterday",
    },
  ],
  archive: [],
};

export function NotificationPopover() {
  const [activeTab, setActiveTab] = useState<NotificationTabs>(NotificationTabs.All);

  const activeNotifications = notifications[activeTab];

  return (
    <Badge.Anchor>
      <Popover>
        <Tooltip delay={500} closeDelay={100}>
          <Button isIconOnly variant="ghost" size="sm" aria-label="Notifications">
            <Icon aria-hidden="true" className="size-4" icon="gravity-ui:bell-fill" />
          </Button>
          <Tooltip.Content placement="bottom" offset={8}>
            Notifications
          </Tooltip.Content>
        </Tooltip>
        <Popover.Content className="w-full max-w-105">
          <Popover.Dialog className="p-0">
            <Card variant="transparent" className="w-full">
              <Card.Header className="flex flex-col">
                <div className="mb-2 flex w-full items-center justify-between">
                  <div className="inline-flex items-center gap-1">
                    <h4 className="text-large inline-block align-middle font-medium">
                      Notifications
                    </h4>
                    <Chip size="sm" variant="secondary">
                      12
                    </Chip>
                  </div>
                  <Button size="sm" variant="ghost">
                    Mark all as read
                  </Button>
                </div>
                <Segment defaultSelectedKey="all" size="sm">
                  <Segment.Item key="all" id="all">
                    All
                  </Segment.Item>
                  <Segment.Item key="unread" id="unread">
                    Unread
                  </Segment.Item>
                  <Segment.Item key="archive" id="archive">
                    Archive
                  </Segment.Item>
                </Segment>
              </Card.Header>
              <Card.Content>
                <ScrollShadow className="h-125 w-full">213</ScrollShadow>
              </Card.Content>
              <Card.Footer>
                <Button
                  size="sm"
                  variant={activeTab === NotificationTabs.Archive ? "secondary" : "ghost"}
                >
                  Settings
                </Button>
                {activeTab !== NotificationTabs.Archive && (
                  <Button size="sm" variant="secondary">
                    Archive All
                  </Button>
                )}
              </Card.Footer>
            </Card>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
      <Badge color="danger" size="sm">
        5
      </Badge>
    </Badge.Anchor>
    // <Badge.Anchor>
    //   <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
    //     <Tooltip delay={500} closeDelay={100}>
    //       <Button
    //         isIconOnly
    //         aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
    //         className="size-10 rounded-xl"
    //         variant="ghost"
    //       >
    //         <Icon aria-hidden="true" className="size-4" icon="lucide:bell" />
    //       </Button>
    //       <Tooltip.Content placement="bottom" offset={8}>
    //         Notifications
    //       </Tooltip.Content>
    //     </Tooltip>

    //     <Popover.Content
    //       isNonModal
    //       className="w-[min(26rem,calc(100vw-1.5rem))] overflow-hidden p-0"
    //       placement="bottom end"
    //     >
    //       <Popover.Arrow />
    //       <Popover.Dialog className="p-0 outline-none">
    //         <header className="border-default-200 flex items-center justify-between gap-3 border-b px-4 py-3">
    //           <div className="flex min-w-0 items-center gap-2">
    //             <Popover.Heading className="text-base font-semibold">Notifications</Popover.Heading>
    //             {unreadCount > 0 ? (
    //               <Chip
    //                 className="h-5 min-w-5 px-1 font-mono text-[10px]"
    //                 color="accent"
    //                 size="sm"
    //                 variant="soft"
    //               >
    //                 {unreadCount > 99 ? "99+" : unreadCount}
    //               </Chip>
    //             ) : null}
    //           </div>
    //           <Tooltip>
    //             <Button
    //               isIconOnly
    //               aria-label="Mark all notifications as read"
    //               isDisabled={unreadCount === 0}
    //               isPending={isMarkingAllRead}
    //               size="sm"
    //               variant="ghost"
    //               onPress={handleMarkAllRead}
    //             >
    //               <Check aria-hidden="true" className="size-4" />
    //             </Button>
    //             <Tooltip.Content>Mark all read</Tooltip.Content>
    //           </Tooltip>
    //         </header>

    //         <Tabs
    //           selectedKey={view}
    //           onSelectionChange={(key) => setView(key === "unread" ? "unread" : "all")}
    //         >
    //           <Tabs.ListContainer className="border-default-200 border-b px-3">
    //             <Tabs.List aria-label="Notification views" className="gap-2">
    //               <Tabs.Tab id="all" className="h-10 px-2 text-sm">
    //                 All
    //                 <Tabs.Indicator />
    //               </Tabs.Tab>
    //               <Tabs.Tab id="unread" className="h-10 px-2 text-sm">
    //                 Unread
    //                 {unreadCount > 0 ? (
    //                   <Chip
    //                     className="h-5 min-w-5 px-1 font-mono text-[10px]"
    //                     size="sm"
    //                     variant="soft"
    //                   >
    //                     {unreadCount > 99 ? "99+" : unreadCount}
    //                   </Chip>
    //                 ) : null}
    //                 <Tabs.Indicator />
    //               </Tabs.Tab>
    //             </Tabs.List>
    //           </Tabs.ListContainer>
    //         </Tabs>

    //         <ScrollShadow className="max-h-[26rem]" hideScrollBar>
    //           {notifications.isLoading ? <NotificationPopoverSkeleton /> : null}

    //           {!notifications.isLoading && notifications.isError ? (
    //             <div className="flex min-h-60 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
    //               <p className="text-muted text-sm">Notifications could not be loaded.</p>
    //               <Button size="sm" variant="secondary" onPress={() => notifications.refetch()}>
    //                 <ArrowRotateLeft aria-hidden="true" className="size-4" />
    //                 Try again
    //               </Button>
    //             </div>
    //           ) : null}

    //           {!notifications.isLoading &&
    //           !notifications.isError &&
    //           notificationEntries.length === 0 ? (
    //             <NotificationPopoverEmptyState unreadOnly={view === "unread"} />
    //           ) : null}

    //           {!notifications.isLoading &&
    //           !notifications.isError &&
    //           notificationEntries.length > 0 ? (
    //             <ul aria-live="polite" className="divide-default-200 divide-y">
    //               {notificationEntries.map((notification) => (
    //                 <NotificationRow
    //                   key={notification.id}
    //                   isPending={pendingNotificationId === notification.id}
    //                   notification={notification}
    //                   onPress={handleNotificationPress}
    //                 />
    //               ))}
    //             </ul>
    //           ) : null}
    //         </ScrollShadow>

    //         <footer className="border-default-200 flex items-center justify-between gap-3 border-t px-4 py-3">
    //           <span className="text-muted text-xs">
    //             {notifications.data?.total
    //               ? `${notifications.data.total.toLocaleString("en-US")} total updates`
    //               : "Activity from your account and writing"}
    //           </span>
    //           <Button
    //             size="sm"
    //             variant="ghost"
    //             onPress={() => {
    //               setIsOpen(false);
    //               router.push("/notifications");
    //             }}
    //           >
    //             <Eye aria-hidden="true" className="size-4" />
    //             View all
    //           </Button>
    //         </footer>
    //       </Popover.Dialog>
    //     </Popover.Content>
    //   </Popover>

    //   {unreadCount > 0 ? (
    //     <Badge color="danger" placement="top-right" size="sm">
    //       <Badge.Label className="min-w-4 px-1 text-[9px] leading-4">
    //         {unreadCount > 99 ? "99+" : unreadCount}
    //       </Badge.Label>
    //     </Badge>
    //   ) : null}
    // </Badge.Anchor>
  );
}

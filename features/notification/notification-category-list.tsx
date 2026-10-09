"use client";

import { Button, Chip, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { selectIsAdmin } from "@/lib/features/auth";
import { useModerateCommentMutation } from "@/lib/features/comment";
import { useModerateFriendLinkMutation } from "@/lib/features/friend-link";
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  type NotificationResponse,
  useMarkNotificationAsDoneMutation,
} from "@/lib/features/notification";
import { useAuditUserMutation } from "@/lib/features/openapi/openapi-api";
import {
  getNotificationIcon,
  getNotificationDestination,
  getNotificationTypeLabel,
} from "@/lib/notification-presentation";
import { useRelativeTime } from "@/lib/relative-time";
import { useAppSelector } from "@/lib/hooks";

type InboxView = "inbox" | "saved" | "done";

type NotificationListProps = {
  category?: NotificationCategory;
  disabled: boolean;
  notifications: NotificationResponse[];
  onComplete?: (id: number) => void;
  onDelete?: (id: number) => void;
  onOpen: (notification: NotificationResponse) => void;
  onReopen?: (id: number) => void;
  onSave?: (notification: NotificationResponse) => void;
  pendingActions: ReadonlyMap<number, string>;
  showInboxActions?: boolean;
  view?: InboxView;
};

function reviewTarget(notification: NotificationResponse) {
  const context = notification.context;
  if (!context || context.action !== "REVIEW") return null;
  if (notification.type === "USER_PENDING_REVIEW" && context.objectType === "USER") {
    return { kind: "user" as const, id: context.objectId };
  }
  if (
    (notification.type === "COMMENT_PENDING_REVIEW" || notification.type === "COMMENT_FLAGGED") &&
    context.objectType === "COMMENT"
  ) {
    return { kind: "comment" as const, id: context.objectId };
  }
  if (notification.type === "FRIEND_LINK_APPLICATION" && context.objectType === "FRIEND_LINK") {
    return { kind: "friend-link" as const, id: context.objectId };
  }
  return null;
}

function RegistrationDecision({
  disabled,
  notification,
}: {
  disabled: boolean;
  notification: NotificationResponse;
}) {
  const t = useTranslations("Notifications");
  const isAdmin = useAppSelector(selectIsAdmin);
  const target = reviewTarget(notification);
  const [auditUser, auditState] = useAuditUserMutation();
  const [moderateComment, commentState] = useModerateCommentMutation();
  const [moderateFriendLink, linkState] = useModerateFriendLinkMutation();
  const [markDone] = useMarkNotificationAsDoneMutation();
  const pending = auditState.isLoading || commentState.isLoading || linkState.isLoading;

  if (!isAdmin || !target || notification.completedAt) return null;

  const decide = async (approved: boolean) => {
    if (target.kind === "user") {
      await auditUser({ id: target.id, approved }).unwrap();
    } else if (target.kind === "comment") {
      await moderateComment({ id: target.id, status: approved ? "APPROVED" : "REJECTED" }).unwrap();
    } else {
      await moderateFriendLink({
        id: target.id,
        status: approved ? "APPROVED" : "REJECTED",
      }).unwrap();
    }
    await markDone(notification.id).unwrap();
  };

  return (
    <div className="mt-3 flex gap-2">
      <Button
        isDisabled={disabled || pending}
        isPending={pending}
        size="sm"
        variant="secondary"
        onPress={() => decide(true)}
      >
        {target.kind === "user" ? t("approveAccount") : t("approve")}
      </Button>
      <Button
        isDisabled={disabled || pending}
        size="sm"
        variant="ghost"
        onPress={() => decide(false)}
      >
        {t("reject")}
      </Button>
    </div>
  );
}

function NotificationRow({
  actions,
  category,
  disabled,
  notification,
  onComplete,
  onDelete,
  onOpen,
  onReopen,
  onSave,
  pending,
  showCategory,
  showInboxActions,
  view,
}: {
  actions?: ReactNode;
  category: NotificationCategory;
  disabled: boolean;
  notification: NotificationResponse;
  onComplete?: (id: number) => void;
  onDelete?: (id: number) => void;
  onOpen: (notification: NotificationResponse) => void;
  onReopen?: (id: number) => void;
  onSave?: (notification: NotificationResponse) => void;
  pending?: string;
  showCategory: boolean;
  showInboxActions: boolean;
  view: InboxView;
}) {
  const t = useTranslations("Notifications");
  const formatRelativeTime = useRelativeTime();
  const destination = getNotificationDestination(notification);
  const rowLocked = disabled || pending !== undefined;

  return (
    <li className={notification.read ? "px-4 py-3" : "bg-accent/5 px-4 py-3"}>
      <div className="flex gap-3">
        <span className="bg-default text-muted mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon
            aria-hidden="true"
            className="size-4"
            icon={getNotificationIcon(notification.type)}
          />
        </span>
        <div className="min-w-0 flex-1">
          <Button
            fullWidth
            className="h-auto items-start justify-start p-0 text-left"
            isPending={pending === "read"}
            isDisabled={rowLocked}
            variant="ghost"
            onPress={() => destination && onOpen(notification)}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-foreground line-clamp-1 text-sm font-semibold">
                  {notification.title}
                </span>
                {!notification.read ? (
                  <span
                    aria-label={t("unread")}
                    className="bg-accent size-2 shrink-0 rounded-full"
                  />
                ) : null}
              </span>
              <span className="text-muted mt-1 line-clamp-3 block text-sm leading-5 whitespace-pre-wrap">
                {notification.content}
              </span>
            </span>
          </Button>
          <span className="text-muted mt-2 flex flex-wrap items-center gap-2 text-xs">
            <time dateTime={notification.createdAt}>
              {formatRelativeTime(notification.createdAt)}
            </time>
            {showCategory ? (
              <Chip size="sm" variant="soft">
                {t(`category.${category}`)}
              </Chip>
            ) : null}
            <Chip size="sm" variant="soft">
              {getNotificationTypeLabel(notification.type, t("typeFallback"))}
            </Chip>
          </span>
          {actions}
        </div>
        {showInboxActions ? (
          <div className="flex shrink-0 items-start">
            <Tooltip>
              <Button
                isIconOnly
                aria-label={notification.saved ? t("removeSaved") : t("saveNotification")}
                isPending={pending === "save"}
                isDisabled={rowLocked}
                size="sm"
                variant="ghost"
                onPress={() => onSave?.(notification)}
              >
                <Icon icon="gravity-ui:bookmark" aria-hidden="true" className="size-4" />
              </Button>
              <Tooltip.Content>
                {notification.saved ? t("removeSaved") : t("saveForLater")}
              </Tooltip.Content>
            </Tooltip>
            {view === "done" ? (
              <Tooltip>
                <Button
                  isIconOnly
                  aria-label={t("reopenNamed", { title: notification.title })}
                  isPending={pending === "reopen"}
                  isDisabled={rowLocked}
                  size="sm"
                  variant="ghost"
                  onPress={() => onReopen?.(notification.id)}
                >
                  <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" className="size-4" />
                </Button>
                <Tooltip.Content>{t("returnToInbox")}</Tooltip.Content>
              </Tooltip>
            ) : (
              <Tooltip>
                <Button
                  isIconOnly
                  aria-label={t("completeNamed", { title: notification.title })}
                  isPending={pending === "complete"}
                  isDisabled={rowLocked}
                  size="sm"
                  variant="ghost"
                  onPress={() => onComplete?.(notification.id)}
                >
                  <Icon icon="gravity-ui:circle-check" aria-hidden="true" className="size-4" />
                </Button>
                <Tooltip.Content>{t("markDone")}</Tooltip.Content>
              </Tooltip>
            )}
            <Tooltip>
              <Button
                isIconOnly
                aria-label={t("deleteNamed", { title: notification.title })}
                isPending={pending === "delete"}
                isDisabled={rowLocked}
                size="sm"
                variant="ghost"
                onPress={() => onDelete?.(notification.id)}
              >
                <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-4" />
              </Button>
              <Tooltip.Content>{t("deleteNotification")}</Tooltip.Content>
            </Tooltip>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function CategorySection({
  category,
  children,
  label,
}: {
  category: NotificationCategory;
  children: ReactNode;
  label?: string;
}) {
  return (
    <section aria-label={label ?? category}>
      {label ? (
        <p className="text-muted px-4 pt-3 text-xs font-semibold tracking-wide uppercase">
          {label}
        </p>
      ) : null}
      {children}
    </section>
  );
}

function CommentNotificationList(props: NotificationListProps & { showCategory: boolean }) {
  return (
    <ul
      aria-label={props.showCategory ? undefined : "Comments"}
      className="divide-default-200 divide-y"
    >
      {props.notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          category="COMMENT"
          notification={notification}
          {...props}
          pending={props.pendingActions.get(notification.id)}
          showCategory={props.showCategory}
          showInboxActions={props.showInboxActions ?? false}
          view={props.view ?? "inbox"}
        />
      ))}
    </ul>
  );
}

function FollowNotificationList(props: NotificationListProps & { showCategory: boolean }) {
  return (
    <ul className="divide-default-200 divide-y">
      {props.notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          category="CATEGORY_POST"
          notification={notification}
          {...props}
          pending={props.pendingActions.get(notification.id)}
          showCategory={props.showCategory}
          showInboxActions={props.showInboxActions ?? false}
          view={props.view ?? "inbox"}
        />
      ))}
    </ul>
  );
}

function CreatorNotificationList(props: NotificationListProps & { showCategory: boolean }) {
  return (
    <ul className="divide-default-200 divide-y">
      {props.notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          category="CREATOR"
          notification={notification}
          {...props}
          pending={props.pendingActions.get(notification.id)}
          showCategory={props.showCategory}
          showInboxActions={props.showInboxActions ?? false}
          view={props.view ?? "inbox"}
        />
      ))}
    </ul>
  );
}

function ModerationNotificationList(props: NotificationListProps & { showCategory: boolean }) {
  return (
    <ul className="divide-default-200 divide-y">
      {props.notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          actions={<RegistrationDecision disabled={props.disabled} notification={notification} />}
          category="MODERATION"
          notification={notification}
          {...props}
          pending={props.pendingActions.get(notification.id)}
          showCategory={props.showCategory}
          showInboxActions={props.showInboxActions ?? false}
          view={props.view ?? "inbox"}
        />
      ))}
    </ul>
  );
}

function ReportNotificationList(props: NotificationListProps & { showCategory: boolean }) {
  return (
    <ul className="divide-default-200 divide-y">
      {props.notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          category="REPORT"
          notification={notification}
          {...props}
          pending={props.pendingActions.get(notification.id)}
          showCategory={props.showCategory}
          showInboxActions={props.showInboxActions ?? false}
          view={props.view ?? "inbox"}
        />
      ))}
    </ul>
  );
}

function OperationsNotificationList(props: NotificationListProps & { showCategory: boolean }) {
  return (
    <ul className="divide-default-200 divide-y">
      {props.notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          category="OPERATIONS"
          notification={notification}
          {...props}
          pending={props.pendingActions.get(notification.id)}
          showCategory={props.showCategory}
          showInboxActions={props.showInboxActions ?? false}
          view={props.view ?? "inbox"}
        />
      ))}
    </ul>
  );
}

const CATEGORY_LISTS = {
  COMMENT: CommentNotificationList,
  CATEGORY_POST: FollowNotificationList,
  CREATOR: CreatorNotificationList,
  MODERATION: ModerationNotificationList,
  REPORT: ReportNotificationList,
  OPERATIONS: OperationsNotificationList,
} satisfies Record<
  NotificationCategory,
  (props: NotificationListProps & { showCategory: boolean }) => ReactNode
>;

export function categoryFor(type: string): NotificationCategory {
  if (
    type === "COMMENT_APPROVED" ||
    type === "COMMENT_REJECTED" ||
    type === "COMMENT_REPLY" ||
    type === "POST_COMMENT" ||
    type === "MOMENT_COMMENT"
  ) {
    return "COMMENT";
  }
  if (type === "CATEGORY_POST") return "CATEGORY_POST";
  if (
    type === "POST_REJECTED" ||
    type === "POST_PUBLISHED" ||
    type === "POST_SCHEDULED" ||
    type === "POST_SCHEDULE_CANCELED" ||
    type === "POST_ARCHIVED"
  ) {
    return "CREATOR";
  }
  if (
    type === "COMMENT_PENDING_REVIEW" ||
    type === "COMMENT_FLAGGED" ||
    type === "POST_PENDING_REVIEW" ||
    type === "FRIEND_LINK_APPLICATION" ||
    type === "GUESTBOOK_COMMENT" ||
    type === "USER_PENDING_REVIEW"
  ) {
    return "MODERATION";
  }
  if (type.includes("REPORT")) return "REPORT";
  return "OPERATIONS";
}

export function NotificationCategoryList(props: NotificationListProps) {
  const t = useTranslations("Notifications");
  const groups = props.category
    ? [[props.category, props.notifications] as const]
    : NOTIFICATION_CATEGORIES.flatMap((category) => {
        const notifications = props.notifications.filter(
          (notification) => categoryFor(notification.type) === category
        );
        return notifications.length > 0 ? [[category, notifications] as const] : [];
      });

  return (
    <div>
      {groups.map(([category, notifications]) => {
        const List = CATEGORY_LISTS[category];
        return (
          <CategorySection
            key={category}
            category={category}
            label={props.category ? undefined : t(`category.${category}`)}
          >
            <List {...props} notifications={notifications} showCategory={Boolean(props.category)} />
          </CategorySection>
        );
      })}
    </div>
  );
}

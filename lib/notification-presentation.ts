const READER_LINK_PREFIXES = ["/single/", "/moments", "/guestbook", "/notifications"];

const REVIEW_DESTINATION_PATHS = {
  COMMENT: "/comments",
  FRIEND_LINK: "/links",
  POST: "/posts",
  USER: "/users",
} as const;

export type NotificationDestination =
  | { kind: "reader"; href: string }
  | { kind: "dashboard"; path: string }
  | { kind: "external"; href: string };

const notificationDateFormatters = new Map<string, Intl.DateTimeFormat>();

function notificationDateFormatter(locale: string) {
  const cached = notificationDateFormatters.get(locale);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  notificationDateFormatters.set(locale, formatter);
  return formatter;
}

export function getNotificationTypeLabel(type: string, fallback = "Update") {
  const label = type.replace(/[_-]+/g, " ").trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : fallback;
}

export function getNotificationIcon(type: string) {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("report")) return "lucide:flag";
  if (normalizedType.includes("friend_link") || normalizedType.includes("friend-link")) {
    return "lucide:link";
  }
  if (normalizedType.includes("comment") || normalizedType.includes("reply")) {
    return "lucide:message-square";
  }
  if (normalizedType.includes("like") || normalizedType.includes("favorite")) {
    return "lucide:heart";
  }
  if (normalizedType.includes("follow") || normalizedType.includes("category")) {
    return "lucide:user-plus";
  }
  if (
    normalizedType.includes("publish") ||
    normalizedType.includes("scheduled") ||
    normalizedType.includes("archived")
  ) {
    return "lucide:file-text";
  }
  if (normalizedType.includes("health")) return "lucide:heart-pulse";

  return "lucide:bell-ring";
}

/**
 * Reader surfaces can open public writing, moments, and the guestbook.
 * Admin queue links stay informational until those consoles accept the same query.
 */
export function getNotificationReaderHref(link: string | null | undefined) {
  const value = link?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith("/")) return null;
  const path = value.split(/[?#]/, 1)[0] ?? value;
  return READER_LINK_PREFIXES.some(
    (prefix) => path === prefix.replace(/\/$/, "") || path.startsWith(prefix)
  )
    ? value
    : null;
}

export function getNotificationDestination(
  notification: Pick<NotificationResponseLike, "link" | "type" | "context">
): NotificationDestination | null {
  const context = notification.context;
  if (context?.action === "REVIEW" || context?.action === "REVIEW_REPORT") {
    const path = REVIEW_DESTINATION_PATHS[context.objectType];
    if (path) return { kind: "dashboard", path };
  }

  const link = getNotificationReaderHref(notification.link);
  if (!link) return null;
  if (/^https?:\/\//i.test(link)) return { kind: "external", href: link };
  return { kind: "reader", href: link };
}

type NotificationResponseLike = {
  link?: string | null;
  type: string;
  context?: {
    objectType: "POST" | "COMMENT" | "FRIEND_LINK" | "USER";
    objectId: number;
    action: "VIEW" | "REVIEW" | "EDIT" | "REVIEW_REPORT";
  } | null;
};

export function formatNotificationDate(value: string, locale: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp)
    ? notificationDateFormatter(locale).format(new Date(timestamp))
    : "";
}

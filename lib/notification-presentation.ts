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

  if (normalizedType.includes("comment") || normalizedType.includes("reply")) {
    return "lucide:message-square";
  }
  if (normalizedType.includes("like") || normalizedType.includes("favorite")) {
    return "lucide:heart";
  }
  if (normalizedType.includes("follow")) return "lucide:user-plus";
  if (normalizedType.includes("publish")) return "lucide:file-text";

  return "lucide:bell-ring";
}

export function formatNotificationDate(value: string, locale: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp)
    ? notificationDateFormatter(locale).format(new Date(timestamp))
    : "";
}

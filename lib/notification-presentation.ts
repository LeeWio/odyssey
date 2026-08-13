const notificationDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function getNotificationTypeLabel(type: string) {
  const label = type.replace(/[_-]+/g, " ").trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : "Update";
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

export function formatNotificationDate(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? notificationDateFormatter.format(new Date(timestamp)) : "";
}

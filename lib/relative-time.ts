const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(
  value: string | null | undefined,
  { fallback = "Recently", now = Date.now() }: { fallback?: string; now?: number } = {}
) {
  if (!value) return fallback;

  // Treat timezone-less ISO strings from server as UTC to prevent browser local timezone parse discrepancies
  const dateStr =
    value.includes("T") && !value.endsWith("Z") && !value.includes("+") ? `${value}Z` : value;

  const timestamp = new Date(dateStr).getTime();
  if (!Number.isFinite(timestamp)) return fallback;

  const seconds = Math.round((timestamp - now) / 1000);
  if (Math.abs(seconds) < 60) return "Just now";

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return relativeTimeFormatter.format(minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTimeFormatter.format(hours, "hour");

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return relativeTimeFormatter.format(days, "day");

  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(
    new Date(timestamp)
  );
}

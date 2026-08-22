import { useFormatter, useNow } from "next-intl";

export function useRelativeTime() {
  const format = useFormatter();
  const now = useNow();

  return (
    value: string | null | undefined,
    { fallback = "Recently" }: { fallback?: string } = {}
  ) => {
    if (!value) return fallback;

    // Treat timezone-less ISO strings from server as UTC to prevent browser local timezone parse discrepancies
    const dateStr =
      value.includes("T") && !value.endsWith("Z") && !value.includes("+") ? `${value}Z` : value;

    const date = new Date(dateStr);
    if (!Number.isFinite(date.getTime())) return fallback;

    // Seamlessly format relative time using next-intl without any manual math calculations!
    return format.relativeTime(date, now);
  };
}

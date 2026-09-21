import { useFormatter, useNow } from "next-intl";

const ISO_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2}(?::?\d{2}(?:\.\d+)?)?)$/i;

/**
 * Parse an API timestamp consistently across browsers and user time zones.
 *
 * JavaScript treats a timezone-less datetime as local time, while the API
 * emits those values as UTC. Explicit positive and negative offsets must be
 * preserved exactly as provided.
 */
export function parseRelativeDate(value: string | null | undefined): Date | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized =
    trimmed.includes("T") && !ISO_TIMEZONE_SUFFIX.test(trimmed) ? `${trimmed}Z` : trimmed;
  const date = new Date(normalized);

  return Number.isFinite(date.getTime()) ? date : null;
}

export function useRelativeTime() {
  const format = useFormatter();
  const now = useNow();

  return (
    value: string | null | undefined,
    { fallback = "Recently" }: { fallback?: string } = {}
  ) => {
    if (!value) return fallback;

    const date = parseRelativeDate(value);
    if (!date) return fallback;

    // Seamlessly format relative time using next-intl without any manual math calculations!
    return format.relativeTime(date, now);
  };
}

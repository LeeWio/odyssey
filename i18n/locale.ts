import { type AppLocale, defaultLocale, locales } from "./config";

export type { AppLocale };

/**
 * Map Accept-Language / BCP-47 tags onto the locales we ship message catalogs for.
 */
export function resolveAppLocale(input: string | null | undefined): AppLocale {
  if (!input) return defaultLocale;

  const candidates = input
    .split(",")
    .map((part) => part.trim().split(";")[0]?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if ((locales as readonly string[]).includes(candidate)) {
      return candidate as AppLocale;
    }
    const base = candidate.split("-")[0];
    if (base && (locales as readonly string[]).includes(base)) {
      return base as AppLocale;
    }
  }

  return defaultLocale;
}

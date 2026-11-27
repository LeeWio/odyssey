import { resolveAppLocale, type AppLocale } from "@/i18n/locale";

type JsonObject = Record<string, unknown>;

// Taxonomy labels can follow the interface language. Article fields are author-owned.
const LOCALIZED_FIELDS = ["name", "description"];

function localeCandidates(locale: string): string[] {
  const normalized = locale.toLowerCase();
  const base = normalized.split("-")[0];
  return Array.from(new Set([normalized, base, "en", "zh"]));
}

function pickTranslation(translations: JsonObject, locale: string): JsonObject | null {
  const normalizedTranslations = Object.fromEntries(
    Object.entries(translations).map(([key, value]) => [key.toLowerCase(), value])
  );
  for (const candidate of localeCandidates(locale)) {
    const value = normalizedTranslations[candidate];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as JsonObject;
  }
  return null;
}

export function getRuntimeLocale(): AppLocale {
  if (typeof document !== "undefined") return resolveAppLocale(document.documentElement.lang);
  if (typeof navigator !== "undefined") return resolveAppLocale(navigator.language);
  return "en";
}

export function localizeApiPayload<T>(value: T, locale = getRuntimeLocale()): T {
  if (Array.isArray(value)) return value.map((item) => localizeApiPayload(item, locale)) as T;
  if (!value || typeof value !== "object") return value;

  const source = value as JsonObject;
  const localized = Object.fromEntries(
    Object.entries(source).map(([key, item]) => [key, localizeApiPayload(item, locale)])
  ) as JsonObject;
  const translations = localized.translations;
  if (translations && typeof translations === "object" && !Array.isArray(translations)) {
    const selected = pickTranslation(translations as JsonObject, locale);
    if (selected) {
      for (const field of LOCALIZED_FIELDS) {
        if (field in selected && selected[field] !== null && selected[field] !== undefined) {
          localized[field] = selected[field];
        }
      }
    }
  }
  return localized as T;
}

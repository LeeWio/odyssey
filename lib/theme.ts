export const THEME_VARIANTS = ["mouve", "glass", "brutalism"] as const;
export type ThemeVariant = (typeof THEME_VARIANTS)[number];

export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;
export type ThemeName = `${ThemeVariant}-${ResolvedThemeMode}`;

export const DEFAULT_THEME_VARIANT: ThemeVariant = "mouve";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";
export const DEFAULT_RESOLVED_THEME_MODE: ResolvedThemeMode = "dark";

export const THEME_VARIANT_STORAGE_KEY = "odyssey_theme_variant";
export const THEME_MODE_STORAGE_KEY = "odyssey_theme_mode";
export const THEME_RESOLVED_MODE_STORAGE_KEY = "odyssey_theme_resolved_mode";
export const THEME_NAME_STORAGE_KEY = "odyssey_theme_name";
export const LEGACY_THEME_STORAGE_KEY = "odyssey_theme";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const THEME_COOKIE_OPTIONS = `path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;

export function isThemeVariant(value: unknown): value is ThemeVariant {
  return typeof value === "string" && THEME_VARIANTS.includes(value as ThemeVariant);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && THEME_MODES.includes(value as ThemeMode);
}

export function isResolvedThemeMode(value: unknown): value is ResolvedThemeMode {
  return value === "light" || value === "dark";
}

export function parseThemeName(value: unknown): {
  variant: ThemeVariant;
  resolvedMode: ResolvedThemeMode;
} | null {
  if (typeof value !== "string") return null;

  const [variant, resolvedMode] = value.split("-") as [ThemeVariant, ResolvedThemeMode];

  if (!isThemeVariant(variant) || !isResolvedThemeMode(resolvedMode)) {
    return null;
  }

  return { variant, resolvedMode };
}

export function coerceThemeVariant(value: unknown): ThemeVariant {
  if (isThemeVariant(value)) return value;

  const parsed = parseThemeName(value);
  return parsed?.variant ?? DEFAULT_THEME_VARIANT;
}

export function coerceThemeMode(value: unknown): ThemeMode {
  if (isThemeMode(value)) return value;

  const parsed = parseThemeName(value);
  return parsed?.resolvedMode ?? DEFAULT_THEME_MODE;
}

export function coerceResolvedThemeMode(value: unknown): ResolvedThemeMode {
  return isResolvedThemeMode(value) ? value : DEFAULT_RESOLVED_THEME_MODE;
}

export function resolveThemeMode(
  mode: ThemeMode | undefined,
  systemMode: ResolvedThemeMode | undefined
): ResolvedThemeMode {
  const safeMode = isThemeMode(mode) ? mode : DEFAULT_THEME_MODE;

  if (safeMode === "system") {
    return coerceResolvedThemeMode(systemMode);
  }

  return safeMode;
}

export function getThemeName(variant: ThemeVariant, resolvedMode: ResolvedThemeMode): ThemeName {
  return `${variant}-${resolvedMode}`;
}

function getCookieValue(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(name.length + 1));
}

export function getInitialThemeState(cookieHeader: string | null | undefined) {
  const legacyTheme = getCookieValue(cookieHeader, LEGACY_THEME_STORAGE_KEY);
  const variant = coerceThemeVariant(
    getCookieValue(cookieHeader, THEME_VARIANT_STORAGE_KEY) ?? legacyTheme
  );
  const mode = coerceThemeMode(getCookieValue(cookieHeader, THEME_MODE_STORAGE_KEY) ?? legacyTheme);
  const resolvedMode =
    mode === "system"
      ? coerceResolvedThemeMode(getCookieValue(cookieHeader, THEME_RESOLVED_MODE_STORAGE_KEY))
      : resolveThemeMode(mode, undefined);

  return {
    mode,
    resolvedMode,
    themeName: getThemeName(variant, resolvedMode),
    variant,
  };
}

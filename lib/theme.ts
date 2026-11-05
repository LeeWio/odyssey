export const THEME_VARIANTS = ["mouve", "glass", "brutalism"] as const;
export type ThemeVariant = (typeof THEME_VARIANTS)[number];

export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;

export const DEFAULT_THEME_VARIANT: ThemeVariant = "glass";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";
export const DEFAULT_RESOLVED_THEME_MODE: ResolvedThemeMode = "dark";

/** Palette. Written only by `setStoredThemeVariant`. */
export const THEME_VARIANT_STORAGE_KEY = "odyssey_theme_variant";
/** Light, dark, or system. Written by next-themes. */
export const THEME_MODE_STORAGE_KEY = "odyssey_theme_mode";
export const THEME_CHANGE_EVENT = "odyssey-theme-change";

const LEGACY_THEME_STORAGE_KEY = "odyssey_theme";
const THEME_COOKIE = `path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

const PALETTE_CLASSES = THEME_VARIANTS.flatMap((variant) => [
  `${variant}-light`,
  `${variant}-dark`,
]);

export function isThemeVariant(value: unknown): value is ThemeVariant {
  return typeof value === "string" && THEME_VARIANTS.includes(value as ThemeVariant);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && THEME_MODES.includes(value as ThemeMode);
}

export function isResolvedThemeMode(value: unknown): value is ResolvedThemeMode {
  return value === "light" || value === "dark";
}

export function resolveThemeMode(
  mode: ThemeMode,
  systemMode: ResolvedThemeMode
): ResolvedThemeMode {
  return mode === "system" ? systemMode : mode;
}

export interface ThemeRoot {
  dataset: { theme?: string };
  classList: {
    add(token: string): void;
    remove(...tokens: string[]): void;
  };
}

/** Write the selector Pro CSS matches: `data-theme="glass-dark"` and `.glass-dark`. */
export function applyThemeToElement(
  root: ThemeRoot,
  variant: ThemeVariant,
  resolvedMode: ResolvedThemeMode
) {
  const selector = `${variant}-${resolvedMode}`;

  root.dataset.theme = selector;
  root.classList.remove(...PALETTE_CLASSES);
  root.classList.add(selector);
}

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function removeLocal(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; ${THEME_COOKIE}`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function legacyVariant(value: string | null): ThemeVariant | null {
  if (!value) return null;
  if (isThemeVariant(value)) return value;

  const separator = value.lastIndexOf("-");
  if (separator <= 0) return null;

  const variant = value.slice(0, separator);
  const mode = value.slice(separator + 1);

  return isThemeVariant(variant) && isResolvedThemeMode(mode) ? variant : null;
}

function legacyMode(value: string | null): ThemeMode | null {
  if (!value) return null;

  const mode = value.slice(value.lastIndexOf("-") + 1);
  return isThemeMode(mode) ? mode : null;
}

export function getStoredThemeVariant(): ThemeVariant {
  if (typeof window === "undefined") return DEFAULT_THEME_VARIANT;

  const stored = readLocal(THEME_VARIANT_STORAGE_KEY);
  if (isThemeVariant(stored)) return stored;

  const cookieVariant = readCookie(document.cookie, THEME_VARIANT_STORAGE_KEY);
  if (isThemeVariant(cookieVariant)) return cookieVariant;

  return (
    legacyVariant(readLocal(LEGACY_THEME_STORAGE_KEY)) ??
    legacyVariant(readCookie(document.cookie, LEGACY_THEME_STORAGE_KEY)) ??
    DEFAULT_THEME_VARIANT
  );
}

export function setStoredThemeVariant(variant: ThemeVariant) {
  writeLocal(THEME_VARIANT_STORAGE_KEY, variant);
  writeCookie(THEME_VARIANT_STORAGE_KEY, variant);
  removeLocal(LEGACY_THEME_STORAGE_KEY);
  removeCookie(LEGACY_THEME_STORAGE_KEY);

  const resolvedMode = document.documentElement.classList.contains("dark") ? "dark" : "light";
  applyThemeToElement(document.documentElement, variant, resolvedMode);

  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { variant } }));
}

/** next-themes stores the mode in localStorage. SSR can only see the cookie. */
export function persistThemeMode(mode: ThemeMode) {
  writeCookie(THEME_MODE_STORAGE_KEY, mode);
}

export function getInitialTheme(cookieHeader: string | null | undefined) {
  const legacy = readCookie(cookieHeader, LEGACY_THEME_STORAGE_KEY);
  const storedVariant = readCookie(cookieHeader, THEME_VARIANT_STORAGE_KEY);
  const variant = isThemeVariant(storedVariant)
    ? storedVariant
    : (legacyVariant(legacy) ?? DEFAULT_THEME_VARIANT);
  const storedMode = readCookie(cookieHeader, THEME_MODE_STORAGE_KEY);
  const mode = isThemeMode(storedMode) ? storedMode : (legacyMode(legacy) ?? DEFAULT_THEME_MODE);
  const resolvedMode = mode === "light" ? "light" : DEFAULT_RESOLVED_THEME_MODE;

  return {
    resolvedMode,
    selector: `${variant}-${resolvedMode}`,
    variant,
  };
}

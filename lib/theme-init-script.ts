import {
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_VARIANT,
  LEGACY_THEME_STORAGE_KEY,
  THEME_MODE_STORAGE_KEY,
  THEME_NAME_STORAGE_KEY,
  THEME_RESOLVED_MODE_STORAGE_KEY,
  THEME_VARIANT_STORAGE_KEY,
  THEME_VARIANTS,
} from "./theme";

export function getThemeInitScript() {
  return `
(function () {
  var variants = ${JSON.stringify(THEME_VARIANTS)};
  var modes = ["light", "dark", "system"];
  var defaultVariant = ${JSON.stringify(DEFAULT_THEME_VARIANT)};
  var defaultMode = ${JSON.stringify(DEFAULT_THEME_MODE)};
  var variantKey = ${JSON.stringify(THEME_VARIANT_STORAGE_KEY)};
  var modeKey = ${JSON.stringify(THEME_MODE_STORAGE_KEY)};
  var resolvedKey = ${JSON.stringify(THEME_RESOLVED_MODE_STORAGE_KEY)};
  var themeNameKey = ${JSON.stringify(THEME_NAME_STORAGE_KEY)};
  var legacyKey = ${JSON.stringify(LEGACY_THEME_STORAGE_KEY)};

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function readCookie(key) {
    var pairs = document.cookie ? document.cookie.split(";") : [];

    for (var index = 0; index < pairs.length; index += 1) {
      var pair = pairs[index].trim();
      var separator = pair.indexOf("=");

      if (separator === -1) continue;
      if (pair.slice(0, separator) === key) {
        return decodeURIComponent(pair.slice(separator + 1));
      }
    }

    return null;
  }

  function pick(list, value, fallback) {
    return list.indexOf(value) >= 0 ? value : fallback;
  }

  function parseThemeName(value) {
    if (!value || typeof value !== "string") return null;

    var parts = value.split("-");
    if (parts.length !== 2) return null;

    var variant = parts[0];
    var mode = parts[1];

    if (variants.indexOf(variant) === -1 || (mode !== "light" && mode !== "dark")) {
      return null;
    }

    return { variant: variant, mode: mode };
  }

  var legacyTheme = readStorage(legacyKey) || readCookie(legacyKey);
  var parsedLegacyTheme = parseThemeName(legacyTheme);
  var variant = pick(
    variants,
    readStorage(variantKey) ||
      readCookie(variantKey) ||
      (parsedLegacyTheme && parsedLegacyTheme.variant) ||
      legacyTheme,
    defaultVariant
  );
  var selectedMode = pick(
    modes,
    readStorage(modeKey) ||
      readCookie(modeKey) ||
      (parsedLegacyTheme && parsedLegacyTheme.mode) ||
      defaultMode,
    defaultMode
  );
  var systemMode =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  var resolvedMode = selectedMode === "system" ? systemMode : selectedMode;
  var root = document.documentElement;
  var themeName = variant + "-" + resolvedMode;

  root.dataset.theme = themeName;
  root.dataset.themeVariant = variant;
  root.dataset.themeMode = selectedMode;
  root.dataset.themeResolvedMode = resolvedMode;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedMode);
  root.style.colorScheme = resolvedMode;

  try {
    window.localStorage.setItem(variantKey, variant);
    window.localStorage.setItem(modeKey, selectedMode);
    window.localStorage.setItem(resolvedKey, resolvedMode);
    window.localStorage.setItem(themeNameKey, themeName);
  } catch (error) {}
})();
`.trim();
}

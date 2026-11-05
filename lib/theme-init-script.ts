import {
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_VARIANT,
  THEME_MODE_STORAGE_KEY,
  THEME_VARIANT_STORAGE_KEY,
  THEME_VARIANTS,
} from "./theme";

/**
 * Paints `data-theme` and the Pro palette class before hydration.
 * next-themes paints `.light` / `.dark` from its own script.
 */
export function getThemeInitScript() {
  return `
(function () {
  var variants = ${JSON.stringify([...THEME_VARIANTS])};
  var defaultVariant = ${JSON.stringify(DEFAULT_THEME_VARIANT)};
  var defaultMode = ${JSON.stringify(DEFAULT_THEME_MODE)};
  var variantKey = ${JSON.stringify(THEME_VARIANT_STORAGE_KEY)};
  var modeKey = ${JSON.stringify(THEME_MODE_STORAGE_KEY)};
  var legacyKey = "odyssey_theme";
  var paletteClasses = ${JSON.stringify(THEME_VARIANTS.flatMap((variant) => [`${variant}-light`, `${variant}-dark`]))};

  function read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {}
  }

  function cookie(key) {
    var pairs = document.cookie ? document.cookie.split(";") : [];
    for (var index = 0; index < pairs.length; index += 1) {
      var pair = pairs[index].trim();
      var separator = pair.indexOf("=");
      if (separator !== -1 && pair.slice(0, separator) === key) {
        return decodeURIComponent(pair.slice(separator + 1));
      }
    }
    return null;
  }

  function variantOf(value) {
    if (!value) return null;
    if (variants.indexOf(value) >= 0) return value;
    var separator = value.lastIndexOf("-");
    if (separator <= 0) return null;
    var variant = value.slice(0, separator);
    var mode = value.slice(separator + 1);
    return variants.indexOf(variant) >= 0 && (mode === "light" || mode === "dark") ? variant : null;
  }

  function modeOf(value) {
    if (!value) return null;
    var mode = value.slice(value.lastIndexOf("-") + 1);
    return mode === "light" || mode === "dark" || mode === "system" ? mode : null;
  }

  var legacy = read(legacyKey) || cookie(legacyKey);
  var variant = variantOf(read(variantKey)) || variantOf(cookie(variantKey)) || variantOf(legacy) || defaultVariant;
  var mode = modeOf(read(modeKey)) || modeOf(cookie(modeKey)) || modeOf(legacy) || defaultMode;

  if (legacy) {
    if (!variantOf(read(variantKey))) {
      write(variantKey, variant);
      document.cookie = variantKey + "=" + encodeURIComponent(variant) + "; path=/; max-age=31536000; SameSite=Lax";
    }
    try { window.localStorage.removeItem(legacyKey); } catch (error) {}
    document.cookie = legacyKey + "=; path=/; max-age=0; SameSite=Lax";
  }

  var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  var root = document.documentElement;
  var selector = variant + "-" + resolved;

  root.setAttribute("data-theme", selector);
  paletteClasses.forEach(function (className) { root.classList.remove(className); });
  root.classList.add(selector);
})();
`.trim();
}

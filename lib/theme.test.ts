import { describe, expect, it } from "vitest";

import { applyThemeToElement, getInitialTheme, getStoredThemeVariant } from "./theme";

function createRoot(classes: string[] = []) {
  const tokens = new Set(classes);

  return {
    dataset: {} as { theme?: string },
    classList: {
      add(token: string) {
        tokens.add(token);
      },
      remove(...removed: string[]) {
        for (const token of removed) tokens.delete(token);
      },
    },
    tokens,
  };
}

describe("applyThemeToElement", () => {
  it("writes the Pro selector and leaves the color-scheme class alone", () => {
    const root = createRoot(["dark", "glass-dark"]);

    applyThemeToElement(root, "mouve", "light");

    expect(root.dataset.theme).toBe("mouve-light");
    expect(root.tokens.has("mouve-light")).toBe(true);
    expect(root.tokens.has("glass-dark")).toBe(false);
    expect(root.tokens.has("dark")).toBe(true);
  });
});

describe("getStoredThemeVariant", () => {
  it("uses the cookie when localStorage is empty", () => {
    localStorage.removeItem("odyssey_theme_variant");
    document.cookie = "odyssey_theme_variant=mouve; path=/";

    expect(getStoredThemeVariant()).toBe("mouve");

    document.cookie = "odyssey_theme_variant=; path=/; max-age=0";
  });
});

describe("getInitialTheme", () => {
  it("reads the palette and mode cookies", () => {
    expect(getInitialTheme("odyssey_theme_variant=mouve; odyssey_theme_mode=light")).toEqual({
      resolvedMode: "light",
      selector: "mouve-light",
      variant: "mouve",
    });
  });

  it("falls back to the legacy combined cookie", () => {
    expect(getInitialTheme("odyssey_theme=brutalism-dark").selector).toBe("brutalism-dark");
  });

  it("uses the dark selector when mode is system", () => {
    expect(getInitialTheme("odyssey_theme_mode=system").selector).toBe("glass-dark");
  });
});

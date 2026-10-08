import { describe, expect, it } from "vitest";

import { applyThemeToElement } from "./theme";

function createRoot(initial: { dark?: boolean; light?: boolean } = {}) {
  const classes = new Set<string>();
  if (initial.dark) classes.add("dark");
  if (initial.light) classes.add("light");

  return {
    dataset: {} as {
      theme?: string;
      themeVariant?: string;
      themeMode?: string;
      themeResolvedMode?: string;
    },
    classList: {
      toggle(token: string, force?: boolean) {
        if (force) classes.add(token);
        else classes.delete(token);
      },
    },
    style: { colorScheme: "" },
    classes,
  };
}

describe("applyThemeToElement", () => {
  it("writes the resolved theme onto the root before any effect can run", () => {
    const root = createRoot({ dark: true });

    const themeName = applyThemeToElement(root, "mouve", "light", "light");

    expect(themeName).toBe("mouve-light");
    expect(root.dataset).toEqual({
      theme: "mouve-light",
      themeVariant: "mouve",
      themeMode: "light",
      themeResolvedMode: "light",
    });
    expect(root.style.colorScheme).toBe("light");
    expect(root.classes.has("light")).toBe(true);
    expect(root.classes.has("dark")).toBe(false);
  });

  it("keeps system mode distinct from the resolved color scheme", () => {
    const root = createRoot();

    applyThemeToElement(root, "glass", "system", "dark");

    expect(root.dataset.theme).toBe("glass-dark");
    expect(root.dataset.themeMode).toBe("system");
    expect(root.dataset.themeResolvedMode).toBe("dark");
    expect(root.classes.has("dark")).toBe(true);
  });
});

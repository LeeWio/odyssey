import { describe, expect, it } from "vitest";
import { resolveAppLocale } from "./locale";

describe("resolveAppLocale", () => {
  it("returns the default locale when input is missing", () => {
    expect(resolveAppLocale(null)).toBe("en");
    expect(resolveAppLocale(undefined)).toBe("en");
    expect(resolveAppLocale("")).toBe("en");
  });

  it("maps BCP-47 tags onto shipped catalogs", () => {
    expect(resolveAppLocale("zh-CN")).toBe("zh");
    expect(resolveAppLocale("en-US,en;q=0.9")).toBe("en");
    expect(resolveAppLocale("zh")).toBe("zh");
  });

  it("falls back when no candidate matches", () => {
    expect(resolveAppLocale("fr-FR,fr;q=0.9")).toBe("en");
  });
});

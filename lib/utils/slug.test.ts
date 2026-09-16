import { describe, expect, it } from "vitest";

import { isValidUrlSlug, toUrlSlug, validateUrlSlug } from "./slug";

describe("toUrlSlug", () => {
  it("lowercases and hyphenates display names", () => {
    expect(toUrlSlug("Linux")).toBe("linux");
    expect(toUrlSlug("Next.js")).toBe("next-js");
    expect(toUrlSlug("  Hello World  ")).toBe("hello-world");
  });
});

describe("isValidUrlSlug", () => {
  it("accepts backend-compatible slugs", () => {
    expect(isValidUrlSlug("linux")).toBe(true);
    expect(isValidUrlSlug("next-js")).toBe(true);
    expect(isValidUrlSlug("a")).toBe(true);
  });

  it("rejects empty, bordered, or uppercase slugs", () => {
    expect(isValidUrlSlug("")).toBe(false);
    expect(isValidUrlSlug("Linux")).toBe(false);
    expect(isValidUrlSlug("linux-")).toBe(false);
    expect(isValidUrlSlug("-linux")).toBe(false);
  });
});

describe("validateUrlSlug", () => {
  it("reports required before character-set errors", () => {
    expect(validateUrlSlug("")).toBe("Slug is required");
    expect(validateUrlSlug("   ")).toBe("Slug is required");
    expect(validateUrlSlug("Linux")).toMatch(/lowercase letters/);
    expect(validateUrlSlug("linux")).toBeNull();
  });
});

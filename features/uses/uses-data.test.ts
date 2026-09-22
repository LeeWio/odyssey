import { describe, expect, it } from "vitest";

import {
  filterUsesCategories,
  getUsesItemCount,
  matchesUsesItem,
  toSafeExternalUrl,
  usesData,
} from "./uses-data";

describe("uses-data helpers", () => {
  it("counts every tool across categories", () => {
    expect(getUsesItemCount()).toBeGreaterThanOrEqual(15);
    expect(getUsesItemCount(usesData)).toBe(
      usesData.reduce((total, category) => total + category.items.length, 0)
    );
  });

  it("accepts only http(s) external links", () => {
    expect(toSafeExternalUrl("https://ghostty.org/")).toBe("https://ghostty.org/");
    expect(toSafeExternalUrl("http://example.com")).toBe("http://example.com/");
    expect(toSafeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(toSafeExternalUrl("not a url")).toBeUndefined();
    expect(toSafeExternalUrl("")).toBeUndefined();
  });

  it("matches items by name, tags, note, and category", () => {
    const bun = usesData.flatMap((category) => category.items).find((item) => item.name === "Bun");

    expect(bun).toBeDefined();
    expect(matchesUsesItem(bun!, "bun", "Coding")).toBe(true);
    expect(matchesUsesItem(bun!, "package", "Coding")).toBe(true);
    expect(matchesUsesItem(bun!, "coding", "Coding")).toBe(true);
    expect(matchesUsesItem(bun!, "figma", "Coding")).toBe(false);
  });

  it("filters by category and search query together", () => {
    const codingOnly = filterUsesCategories(usesData, { category: "Coding" });
    expect(codingOnly).toHaveLength(1);
    expect(codingOnly[0]?.name).toBe("Coding");
    expect(codingOnly[0]?.items.length).toBeGreaterThan(0);

    const ghostty = filterUsesCategories(usesData, { query: "ghostty" });
    expect(ghostty).toHaveLength(1);
    expect(ghostty[0]?.items.map((item) => item.name)).toEqual(["Ghostty"]);

    const empty = filterUsesCategories(usesData, {
      category: "Daily",
      query: "studio display",
    });
    expect(empty).toEqual([]);
  });

  it("keeps official product links on listed tools", () => {
    const linked = usesData.flatMap((category) => category.items).filter((item) => item.link);
    expect(linked.length).toBeGreaterThan(10);
    for (const item of linked) {
      expect(toSafeExternalUrl(item.link)).toBeTruthy();
    }
  });
});

import { describe, expect, it } from "vitest";

import { journalPageNumbers, journalStoryHref, journalStoryKey } from "./journal-story";

describe("journal stories", () => {
  it("links a story by slug and falls back to the index", () => {
    expect(journalStoryHref({ slug: "field notes" })).toBe("/single/field notes");
    expect(journalStoryHref({})).toBe("/single");
  });

  it("prefers the slug as a stable key", () => {
    expect(journalStoryKey({ id: 4, slug: "field-notes" })).toBe("field-notes");
    expect(journalStoryKey({ id: 4 })).toBe("4");
  });

  it("keeps short page ranges whole and collapses long ones", () => {
    expect(journalPageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(journalPageNumbers(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });
});

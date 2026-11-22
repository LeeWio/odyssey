import { describe, expect, it } from "vitest";

import {
  formatJournalDate,
  journalPageNumbers,
  journalStoryHref,
  journalStoryKey,
} from "./journal-story";

describe("journal stories", () => {
  it("formats API publication dates with or without an explicit offset", () => {
    expect(formatJournalDate("2026-10-01T04:43:43", "en", "Unknown")).toBe("Oct 1, 2026");
    expect(formatJournalDate("2026-10-01T04:43:43+08:00", "en", "Unknown")).toBe("Sep 30, 2026");
    expect(formatJournalDate("not-a-date", "en", "Unknown")).toBe("Unknown");
  });

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

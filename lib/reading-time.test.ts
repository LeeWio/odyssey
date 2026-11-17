import { describe, expect, it } from "vitest";

import { readingMinutesFromCounts } from "./reading-time";

describe("readingMinutesFromCounts", () => {
  it("uses HeroUI character and word counts", () => {
    expect(
      readingMinutesFromCounts({
        characterCount: 28,
        text: "Hello world from the editor.",
        wordCount: 5,
      })
    ).toBe(1);
  });

  it("estimates Chinese reading time from characters in the editor text", () => {
    const text = "读".repeat(520);
    expect(readingMinutesFromCounts({ characterCount: text.length, text, wordCount: 1 })).toBe(2);
  });

  it("returns one minute for an empty document", () => {
    expect(readingMinutesFromCounts({ characterCount: 0, text: "  ", wordCount: 0 })).toBe(1);
  });
});

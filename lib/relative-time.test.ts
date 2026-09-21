import { describe, expect, it } from "vitest";

import { parseRelativeDate } from "./relative-time";

describe("parseRelativeDate", () => {
  it("treats timezone-less API datetimes as UTC", () => {
    expect(parseRelativeDate("2026-09-21T12:00:00")?.toISOString()).toBe(
      "2026-09-21T12:00:00.000Z"
    );
  });

  it("preserves positive and negative timezone offsets", () => {
    expect(parseRelativeDate("2026-09-21T12:00:00+08:00")?.toISOString()).toBe(
      "2026-09-21T04:00:00.000Z"
    );
    expect(parseRelativeDate("2026-09-21T12:00:00-05:00")?.toISOString()).toBe(
      "2026-09-21T17:00:00.000Z"
    );
  });

  it("returns null for missing or malformed timestamps", () => {
    expect(parseRelativeDate(null)).toBeNull();
    expect(parseRelativeDate("   ")).toBeNull();
    expect(parseRelativeDate("not-a-date")).toBeNull();
  });
});

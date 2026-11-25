import { describe, expect, it } from "vitest";
import { buildWritingHistory } from "./writing-history";

describe("buildWritingHistory", () => {
  const now = new Date("2026-11-25T03:00:00Z");

  it("orders archive buckets and includes months with no new articles", () => {
    const months = buildWritingHistory(
      [
        { year: 2026, month: 10, count: 12 },
        { year: 2026, month: 8, count: 2 },
      ],
      now
    );

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ id: "2025-12", total: 0 });
    expect(months.at(-5)).toEqual({ id: "2026-07", total: 0 });
    expect(months.slice(-4)).toEqual([
      { id: "2026-08", total: 2 },
      { id: "2026-09", total: 2 },
      { id: "2026-10", total: 14 },
      { id: "2026-11", total: 14 },
    ]);
  });

  it("retains the earlier cumulative total when the 12-month window rolls forward", () => {
    const months = buildWritingHistory(
      [
        { year: 2025, month: 11, count: 4 },
        { year: 2025, month: 12, count: 2 },
        { year: 2026, month: 11, count: 3 },
      ],
      now
    );

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ id: "2025-12", total: 6 });
    expect(months.at(-1)).toEqual({ id: "2026-11", total: 9 });
    expect(buildWritingHistory([], now)).toEqual([]);
  });
});

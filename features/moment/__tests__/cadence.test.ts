import { describe, expect, it } from "vitest";

import type { MomentCadenceResponse } from "@/lib/features/moment";

import { cadenceProgress, cadenceRows } from "../utils/cadence";

const cadence: MomentCadenceResponse = {
  zone: "Asia/Shanghai",
  day: { start: "2026-10-13T00:00:00+08:00", active: [0, 1, 2, 8, 23] },
  month: { start: "2026-10-01", days: 31, offset: 4, active: [0, 15] },
  year: { year: 2026, active: [0, 37] },
};

describe("moment cadence dots", () => {
  it("keeps all 24 hours and fills only active hours", () => {
    const rows = cadenceRows(cadence, "day");

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.length === 12)).toBe(true);
    expect(cadenceProgress(rows)).toEqual({ total: 24, value: 5 });
    expect(rows[0]?.slice(0, 3).map((cell) => cell.state)).toEqual(["filled", "filled", "filled"]);
    expect(rows[0]?.[0]?.label).toBe("00:00–01:00");
    expect(rows[0]?.[8]?.state).toBe("filled");
    expect(rows[1]?.[11]?.state).toBe("filled");
    expect(rows[1]?.[11]?.label).toBe("23:00–24:00");
  });

  it("offsets the month without counting the blank weekdays", () => {
    const rows = cadenceRows(cadence, "month");

    expect(rows[0]?.slice(0, 4).map((cell) => cell.state)).toEqual([
      "none",
      "none",
      "none",
      "none",
    ]);
    expect(rows[0]?.[4]?.state).toBe("filled");
    expect(rows[0]?.[4]?.label).toBe("2026-10-01");
    expect(rows.flat()).toHaveLength(36);
    expect(rows[1]?.[7]?.state).toBe("filled");
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.length === 12)).toBe(true);
    expect(rows[2]?.at(-1)?.state).toBe("none");
    expect(cadenceProgress(rows)).toEqual({ total: 31, value: 2 });
  });

  it("uses four rows of weekly buckets", () => {
    const rows = cadenceRows(cadence, "year");

    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.length === 12)).toBe(true);
    expect(rows[0]?.[0]?.state).toBe("filled");
    expect(rows[0]?.[0]?.label).toBe("2026-01-01 – 2026-01-07");
    expect(rows[3]?.[1]?.state).toBe("filled");
    expect(rows[3]?.[1]?.label).toBe("2026-10-08 – 2026-10-14");
    expect(cadenceProgress(rows)).toEqual({ total: 48, value: 2 });
  });

  it("keeps a leap month at 29 counted days", () => {
    const leap: MomentCadenceResponse = {
      ...cadence,
      month: { start: "2028-02-01", days: 29, offset: 2, active: [28] },
    };

    const rows = cadenceRows(leap, "month");
    expect(cadenceProgress(rows)).toEqual({ total: 29, value: 1 });
    expect(
      rows
        .flat()
        .filter((cell) => cell.state !== "none")
        .at(-1)?.state
    ).toBe("filled");
  });
});

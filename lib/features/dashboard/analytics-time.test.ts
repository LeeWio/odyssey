import { describe, expect, it } from "vitest";
import { AnalyticsTimestampSchema, formatAnalyticsTimestamp } from "./analytics-time";
import { VisitorSummarySchema } from "./dashboard-contracts";

describe("analytics timestamps", () => {
  it("renders UTC and offset timestamps as the same Shanghai wall-clock time", () => {
    expect(formatAnalyticsTimestamp("2026-11-16T06:37:00Z")).toBe("11/16 14:37");
    expect(formatAnalyticsTimestamp("2026-11-16T14:37:00+08:00")).toBe("11/16 14:37");
  });

  it("changes the reporting date at Shanghai midnight", () => {
    expect(formatAnalyticsTimestamp("2026-11-15T15:59:59.999999Z")).toBe("11/15 23:59");
    expect(formatAnalyticsTimestamp("2026-11-15T16:00:00Z")).toBe("11/16 00:00");
  });

  it.each([null, undefined, "", "invalid", "2026-11-16T06:37:00"])(
    "does not guess a timezone for %s",
    (value) => expect(formatAnalyticsTimestamp(value)).toBe("—")
  );

  it("rejects ambiguous API timestamps at the response boundary", () => {
    expect(AnalyticsTimestampSchema.safeParse("2026-11-16T06:37:00").success).toBe(false);
    expect(
      VisitorSummarySchema.safeParse({ visitorHash: "visitor", lastSeen: "2026-11-16T06:37:00" })
        .success
    ).toBe(false);
    expect(
      VisitorSummarySchema.safeParse({ visitorHash: "visitor", lastSeen: "2026-11-16T06:37:00Z" })
        .success
    ).toBe(true);
  });
});

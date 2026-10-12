import { describe, expect, it } from "vitest";

import { formatActivityPeriod } from "./github-activity-format";

describe("formatActivityPeriod", () => {
  it("formats an API month using the active locale", () => {
    expect(formatActivityPeriod("2026-03", "en-US", "API period")).toBe("March 2026");
    expect(formatActivityPeriod("2026-03", "zh-CN", "API period")).toBe("2026年3月");
  });

  it("preserves the API label when the month is not machine-readable", () => {
    expect(formatActivityPeriod("March 2026", "zh-CN", "API period")).toBe("API period");
  });
});

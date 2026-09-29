import { describe, expect, it } from "vitest";

import { clampPageToTotal, parsePageParam } from "./pagination";

describe("parsePageParam", () => {
  it("accepts positive integer page numbers", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("24")).toBe(24);
  });

  it.each([null, "", "0", "-2", "1.5", "Infinity", "abc", "9007199254740992"])(
    "falls back for invalid page value %s",
    (value) => {
      expect(parsePageParam(value)).toBe(1);
    }
  );

  it("uses a caller-provided fallback", () => {
    expect(parsePageParam("invalid", 3)).toBe(3);
  });
});

describe("clampPageToTotal", () => {
  it("keeps pages within the available range", () => {
    expect(clampPageToTotal(1, 4)).toBe(1);
    expect(clampPageToTotal(3, 4)).toBe(3);
    expect(clampPageToTotal(9, 4)).toBe(4);
  });

  it("normalizes empty or invalid page ranges to the first page", () => {
    expect(clampPageToTotal(5, 0)).toBe(1);
    expect(clampPageToTotal(0, 3)).toBe(1);
    expect(clampPageToTotal(2, Number.NaN)).toBe(1);
  });
});

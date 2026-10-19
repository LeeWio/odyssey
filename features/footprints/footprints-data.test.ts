import { describe, expect, it } from "vitest";
import {
  FOOTPRINTS,
  getFeaturedFootprints,
  getFootprintMetaLabel,
  getFootprintYears,
  getSortedFootprints,
} from "./footprints-data";

describe("footprint chronology", () => {
  it("orders by year descending then keeps source order within a year", () => {
    const source = Object.freeze([...FOOTPRINTS].reverse());
    const snapshot = [...source];
    expect(getSortedFootprints(source).map((item) => item.id)).toEqual([
      "henan",
      "anhui",
      "huizhou",
      "chongqing",
      "hunan",
      "shenzhen",
      "guangzhou",
      "hubei",
      "shaanxi",
    ]);
    expect(getFeaturedFootprints(2, source).map((item) => item.id)).toEqual(["henan", "anhui"]);
    expect(source).toEqual(snapshot);
  });

  it("deduplicates years and handles an empty collection", () => {
    expect(getFootprintYears([...FOOTPRINTS, FOOTPRINTS[0]])).toEqual([
      2026, 2025, 2024, 2023, 2020, 2019,
    ]);
    expect(getSortedFootprints([])).toEqual([]);
    expect(getFootprintYears([])).toEqual([]);
    expect(getFeaturedFootprints(4, [])).toEqual([]);
    expect(getFeaturedFootprints(-1)).toEqual([]);
  });

  it("keeps memory titles and avoids em-dashes in visitor copy", () => {
    for (const footprint of FOOTPRINTS) {
      expect(footprint.title.trim().length).toBeGreaterThan(0);
      expect(footprint.memory).not.toMatch(/[—–]/);
    }
  });

  it("formats detail and popup meta labels from visit context", () => {
    const hometown = FOOTPRINTS.find((item) => item.id === "hubei");
    const trip = FOOTPRINTS.find((item) => item.id === "shenzhen");
    expect(hometown).toBeDefined();
    expect(trip).toBeDefined();
    expect(getFootprintMetaLabel(hometown!)).toBe("2019 · Hometown");
    expect(getFootprintMetaLabel(trip!)).toBe("2023 · China");
  });
});

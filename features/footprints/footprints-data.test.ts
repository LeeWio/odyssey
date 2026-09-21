import { describe, expect, it } from "vitest";
import {
  FOOTPRINTS,
  getFeaturedFootprints,
  getFootprintArcs,
  getFootprintYears,
  getFootprintsMapView,
  getSortedFootprints,
} from "./footprints-data";

describe("footprint chronology", () => {
  it("keeps source order within the same year and leaves the source untouched", () => {
    const source = Object.freeze([...FOOTPRINTS].reverse());
    const snapshot = [...source];
    expect(getSortedFootprints(source).map((item) => item.id)).toEqual([
      "hubei",
      "shaanxi",
      "henan",
      "guangdong",
      "shenzhen",
      "anhui",
      "sichuan",
    ]);
    expect(getFeaturedFootprints(2, source).map((item) => item.id)).toEqual(["hubei", "shaanxi"]);
    expect(source).toEqual(snapshot);
  });

  it("deduplicates years and handles an empty collection", () => {
    expect(getFootprintYears([...FOOTPRINTS, FOOTPRINTS[0]])).toEqual([2024]);
    expect(getSortedFootprints([])).toEqual([]);
    expect(getFootprintYears([])).toEqual([]);
    expect(getFootprintArcs([])).toEqual([]);
    expect(getFeaturedFootprints(4, [])).toEqual([]);
    expect(getFeaturedFootprints(-1)).toEqual([]);
  });

  it("connects places chronologically with arc data", () => {
    const arcs = getFootprintArcs();
    expect(arcs).toHaveLength(FOOTPRINTS.length - 1);
    expect(arcs[0]).toMatchObject({
      id: "hubei-shaanxi",
      toId: "shaanxi",
      from: [114.3055, 30.5928],
      to: [108.9398, 34.3416],
      route: "Hubei → Shaanxi",
    });
  });

  it("frames the map around China when footprints are present", () => {
    const view = getFootprintsMapView();
    expect(view.center[0]).toBeGreaterThan(100);
    expect(view.center[0]).toBeLessThan(120);
    expect(view.center[1]).toBeGreaterThan(20);
    expect(view.center[1]).toBeLessThan(40);
    expect(view.zoom).toBeGreaterThan(2);
  });
});

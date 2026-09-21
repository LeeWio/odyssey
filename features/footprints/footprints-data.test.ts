import { describe, expect, it } from "vitest";
import {
  FOOTPRINTS,
  getFeaturedFootprints,
  getFootprintArcs,
  getFootprintYears,
  getSortedFootprints,
} from "./footprints-data";

describe("footprint chronology", () => {
  it("shows recent years first without changing the source", () => {
    const source = Object.freeze([...FOOTPRINTS].reverse());
    const snapshot = [...source];
    expect(getSortedFootprints(source).map((item) => item.year)).toEqual([
      2025, 2024, 2023, 2022, 2021,
    ]);
    expect(getFeaturedFootprints(2, source).map((item) => item.id)).toEqual([
      "mount-rainier",
      "shinjuku",
    ]);
    expect(source).toEqual(snapshot);
  });

  it("deduplicates years and handles an empty collection", () => {
    expect(getFootprintYears([...FOOTPRINTS, FOOTPRINTS[0]])).toEqual([
      2025, 2024, 2023, 2022, 2021,
    ]);
    expect(getSortedFootprints([])).toEqual([]);
    expect(getFootprintYears([])).toEqual([]);
    expect(getFootprintArcs([])).toEqual([]);
    expect(getFeaturedFootprints(4, [])).toEqual([]);
    expect(getFeaturedFootprints(-1)).toEqual([]);
  });

  it("connects years chronologically with Flight Paths arc data", () => {
    const arcs = getFootprintArcs();
    expect(arcs).toHaveLength(FOOTPRINTS.length - 1);
    expect(arcs[0]).toMatchObject({
      id: "iceland-cannon-beach",
      toId: "cannon-beach",
      from: [-19.9886, 63.6158],
      to: [-123.9615, 45.8918],
    });
  });
});

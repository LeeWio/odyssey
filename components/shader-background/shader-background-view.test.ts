import { describe, expect, it } from "vitest";

import { selectLiveCoverIds } from "./shader-background-view";

describe("selectLiveCoverIds", () => {
  it("keeps the covers closest to the viewport when the pool is full", () => {
    const selected = selectLiveCoverIds(
      [
        { distance: 700, eligible: true, id: "far", live: true },
        { distance: 40, eligible: true, id: "near", live: false },
        { distance: 20, eligible: true, id: "closest", live: false },
      ],
      2,
      180
    );

    expect(selected).toContain("closest");
    expect(selected).toContain("near");
    expect(selected).not.toContain("far");
  });

  it("does not swap a live cover for one that is only slightly closer", () => {
    const selected = selectLiveCoverIds(
      [
        { distance: 200, eligible: true, id: "current", live: true },
        { distance: 120, eligible: true, id: "nearby", live: false },
      ],
      1,
      180
    );

    expect(selected).toEqual(["current"]);
  });

  it("ignores covers outside the viewport margin", () => {
    expect(
      selectLiveCoverIds(
        [
          { distance: 10, eligible: false, id: "hidden", live: false },
          { distance: 80, eligible: true, id: "shown", live: false },
        ],
        2,
        180
      )
    ).toEqual(["shown"]);
  });
});

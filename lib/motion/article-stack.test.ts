import { describe, expect, it } from "vitest";

import { stackTransition } from "./article-stack";

describe("stackTransition", () => {
  it("disables motion when reduced motion is enabled", () => {
    expect(stackTransition(true, true, 3, 10)).toEqual({ duration: 0 });
  });

  it("caps the expanded stagger for long article lists", () => {
    expect(stackTransition(false, true, 20, 24).delay).toBeCloseTo(0.175);
  });

  it("caps the collapse stagger from the back of the stack", () => {
    expect(stackTransition(false, false, 0, 24).delay).toBeCloseTo(0.1);
  });
});

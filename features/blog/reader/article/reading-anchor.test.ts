import { afterEach, describe, expect, it } from "vitest";

import { scrollReadingAnchorIntoView } from "./reading-anchor";

describe("scrollReadingAnchorIntoView", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("lands the heading below the sticky header", () => {
    const heading = document.createElement("h2");
    heading.id = "chapter-one";
    document.body.append(heading);
    heading.getBoundingClientRect = () =>
      ({ top: 400, bottom: 440, left: 0, right: 100, height: 40, width: 100 }) as DOMRect;
    let scrolled = 0;
    window.scrollTo = ((options?: ScrollToOptions) => {
      scrolled = typeof options === "object" ? (options.top ?? 0) : 0;
    }) as typeof window.scrollTo;

    expect(scrollReadingAnchorIntoView("chapter-one")).toBe(true);
    expect(scrolled).toBe(288);
  });

  it("does nothing when the heading is missing", () => {
    expect(scrollReadingAnchorIntoView("missing")).toBe(false);
  });
});

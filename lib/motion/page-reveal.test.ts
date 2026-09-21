import { describe, expect, it } from "vitest";

import { createPageReveal, pageEaseOut, pageReveal, pageRevealInView } from "./page-reveal";

describe("page reveal presets", () => {
  it("exports the shared ease curve", () => {
    expect(pageEaseOut).toEqual([0.22, 1, 0.36, 1]);
  });

  it("disables travel when reduced motion is on", () => {
    const reveal = pageReveal(true, 0.1, 18);
    expect(reveal.initial).toBe(false);
    expect(reveal.transition.duration).toBe(0);
    expect(reveal.transition.delay).toBe(0.1);
    expect(reveal.transition.ease).toBe(pageEaseOut);
  });

  it("keeps the scroll viewport once:true for in-view reveals", () => {
    const reveal = pageRevealInView(false, 0.06, 14, { amount: 0.2, margin: "-40px" });
    expect(reveal.initial).toEqual({ opacity: 0, y: 14 });
    expect(reveal.whileInView).toEqual({ opacity: 1, y: 0 });
    expect(reveal.viewport).toEqual({ once: true, amount: 0.2, margin: "-40px" });
  });

  it("binds reduced motion through createPageReveal", () => {
    const { reveal, revealInView } = createPageReveal(false, { duration: 0.45 });
    expect(reveal(0.04, 12).transition.duration).toBe(0.45);
    expect(revealInView(0.1, 16).transition.ease).toBe(pageEaseOut);
  });
});

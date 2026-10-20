import { describe, expect, it } from "vitest";

import {
  createPageReveal,
  microEaseOut,
  pageEaseOut,
  pageReveal,
  pageRevealInView,
  sectionPresence,
  sectionRevealDuration,
} from "./page-reveal";

describe("page reveal presets", () => {
  it("exports the shared ease curve", () => {
    expect(pageEaseOut).toEqual([0.22, 1, 0.36, 1]);
    expect(microEaseOut).toBe(pageEaseOut);
  });

  it("disables travel when reduced motion is on", () => {
    const reveal = pageReveal(true, 0.1, 18);
    expect(reveal.initial).toBeUndefined();
    expect(reveal.transition).toMatchObject({ duration: 0, delay: 0 });
  });

  it("uses short section transitions and modest travel by default", () => {
    expect(sectionRevealDuration).toBe(0.24);
    for (const reveal of [
      pageReveal(false),
      pageRevealInView(false),
      createPageReveal(false).reveal(),
    ]) {
      expect(reveal.transition).toMatchObject({ type: "spring", stiffness: 420, damping: 34 });
      expect(reveal.initial).toEqual({ opacity: 0, y: 12 });
    }
  });

  it("removes stagger delays from reduced-motion section reveals", () => {
    const reveal = createPageReveal(true).revealInView(0.4);
    expect(reveal.initial).toBeUndefined();
    expect(reveal.transition).toMatchObject({ duration: 0, delay: 0 });
  });

  it("keeps the scroll viewport once:true for in-view reveals", () => {
    const reveal = pageRevealInView(false, 0.06, 14, { amount: 0.2, margin: "-40px" });
    expect(reveal.initial).toEqual({ opacity: 0, y: 14 });
    expect(reveal.whileInView).toEqual({ opacity: 1, y: 0 });
    expect(reveal.viewport).toEqual({ once: true, amount: 0.2, margin: "-40px" });
  });

  it("enters a section over 250ms and leaves faster when it scrolls away", () => {
    const presence = sectionPresence(false, { delay: 0.08, duration: 0.27 });
    expect(presence.viewport).toEqual({ once: false, amount: 0.35 });
    expect(presence.variants.visible.transition).toMatchObject({
      type: "spring",
      stiffness: 420,
      delay: 0.08,
    });
    expect(presence.variants.hidden.transition.duration).toBe(0.16);
    expect(presence.variants.hidden).toMatchObject({ opacity: 0, y: 12 });
  });

  it("keeps a reduced-motion section visible without travel", () => {
    const presence = sectionPresence(true, { delay: 0.08 });
    expect(presence.variants.hidden).toMatchObject({ opacity: 1, y: 0 });
    expect(presence.variants.visible.transition).toMatchObject({ duration: 0, delay: 0 });
  });

  it("binds reduced motion through createPageReveal", () => {
    const { reveal, revealInView } = createPageReveal(false, { duration: 0.45 });
    expect(reveal(0.04, 12).transition).toMatchObject({ type: "spring", delay: 0.04 });
    expect(revealInView(0.1, 16).transition).toMatchObject({ type: "spring", delay: 0.1 });
  });
});

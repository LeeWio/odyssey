import { describe, expect, it } from "vitest";

import {
  quantizeReadingProgress,
  shouldReportReadingProgress,
  type ReadingCheckpoint,
} from "./reading-progress";

const saved: ReadingCheckpoint = {
  postId: 7,
  progressPercent: 40,
  positionAnchor: "chapter-one",
};

describe("reading progress checkpoints", () => {
  it("quantizes scroll percent to 10-point steps", () => {
    expect(quantizeReadingProgress(0)).toBe(0);
    expect(quantizeReadingProgress(4)).toBe(0);
    expect(quantizeReadingProgress(5)).toBe(10);
    expect(quantizeReadingProgress(44)).toBe(40);
    expect(quantizeReadingProgress(96)).toBe(100);
    expect(quantizeReadingProgress(140)).toBe(100);
    expect(quantizeReadingProgress(Number.NaN)).toBe(0);
  });

  it("skips a repeat of the same article, step, and heading", () => {
    expect(shouldReportReadingProgress(saved, { ...saved })).toBe(false);
  });

  it("reports a new step, a new heading, or a different article", () => {
    expect(shouldReportReadingProgress(saved, { ...saved, progressPercent: 50 })).toBe(true);
    expect(shouldReportReadingProgress(saved, { ...saved, positionAnchor: "chapter-two" })).toBe(
      true
    );
    expect(shouldReportReadingProgress(saved, { ...saved, postId: 8 })).toBe(true);
    expect(shouldReportReadingProgress(null, saved)).toBe(true);
  });
});

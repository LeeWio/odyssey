import { afterEach, describe, expect, it } from "vitest";

import {
  clearPendingReadingProgress,
  getReadingPositionHref,
  readPendingReadingProgress,
  writePendingReadingProgress,
} from "./reading-position";

describe("reading position links", () => {
  it.each([
    ["chapter-two", "/single/guide#chapter-two"],
    ["#chapter%20two", "/single/guide#chapter%20two"],
    ["article-21", "/single/guide#article-21"],
    ["第 2 章", "/single/guide#%E7%AC%AC%202%20%E7%AB%A0"],
    ["#%ZZ", "/single/guide"],
    ["#chapter%00", "/single/guide"],
  ])("handles the saved anchor %s", (anchor, target) => {
    expect(getReadingPositionHref("guide", anchor)).toBe(target);
  });
});

describe("pending reading progress", () => {
  const username = "reader";
  const key = "odyssey_reading_progress:reader:7";
  const checkpoint = {
    postId: 7,
    progressPercent: 40,
    positionAnchor: "#chapter-two",
    observedAt: "2026-11-19T12:00:00.000Z",
  };

  afterEach(() => {
    sessionStorage.clear();
  });

  it("keeps a failed checkpoint for the same article", () => {
    writePendingReadingProgress(username, checkpoint);

    expect(readPendingReadingProgress(username, 7)).toEqual(checkpoint);
    expect(readPendingReadingProgress("another-user", 7)).toBeNull();
  });

  it("drops the checkpoint after a successful save for that article", () => {
    writePendingReadingProgress(username, checkpoint);

    clearPendingReadingProgress(username, checkpoint);

    expect(readPendingReadingProgress(username, 7)).toBeNull();
  });

  it("keeps a newer checkpoint when an older save finishes", () => {
    writePendingReadingProgress(username, checkpoint);
    const newer = { ...checkpoint, progressPercent: 50, positionAnchor: "#chapter-three" };
    writePendingReadingProgress(username, newer);

    clearPendingReadingProgress(username, checkpoint);

    expect(readPendingReadingProgress(username, 7)).toEqual(newer);
  });

  it("rejects a checkpoint outside the progress range", () => {
    sessionStorage.setItem(key, JSON.stringify({ ...checkpoint, progressPercent: 140 }));

    expect(readPendingReadingProgress(username, 7)).toBeNull();
  });
});

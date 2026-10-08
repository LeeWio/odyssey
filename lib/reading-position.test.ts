import { afterEach, describe, expect, it } from "vitest";

import {
  clearPendingReadingProgress,
  readPendingReadingProgress,
  writePendingReadingProgress,
} from "./reading-position";

describe("pending reading progress", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("keeps a failed checkpoint for the same article", () => {
    writePendingReadingProgress({
      postId: 7,
      progressPercent: 40,
      positionAnchor: "#chapter-two",
    });

    expect(readPendingReadingProgress(7)).toEqual({
      postId: 7,
      progressPercent: 40,
      positionAnchor: "#chapter-two",
    });
    expect(readPendingReadingProgress(8)).toBeNull();
  });

  it("drops the checkpoint after a successful save for that article", () => {
    writePendingReadingProgress({
      postId: 7,
      progressPercent: 40,
      positionAnchor: "#chapter-two",
    });

    clearPendingReadingProgress(7);

    expect(readPendingReadingProgress(7)).toBeNull();
  });

  it("rejects a checkpoint outside the progress range", () => {
    sessionStorage.setItem(
      "odyssey_reading_progress",
      JSON.stringify({ postId: 7, progressPercent: 140, positionAnchor: "#chapter" })
    );

    expect(readPendingReadingProgress(7)).toBeNull();
  });
});

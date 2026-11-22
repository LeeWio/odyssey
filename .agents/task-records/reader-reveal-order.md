# READER-MOTION-003

## Problem

On live revision `8859e82`, Chromium rendered reveal 101 at 966.4 ms, showed block 102 directly at 1049.2 ms, and started reveal 103 at 1057.9 ms. Block 102 was a paragraph within the 1000 px viewport at y=648–676. The trace recorded eight visible pending blocks and a call from the backlog branch of `advance`. WebKit showed the same three-block gap.

Across eleven 120 px wheel steps with 45 ms between inputs, Chromium animated 16 of 31 eligible blocks and WebKit animated 15 of 31. The dropped paragraphs were still visible when they became fully opaque.

## Design and acceptance

Keep the queue in document order. Preserve the opening pace and shorten the time between starts when several blocks are already visible. Reschedule pending starts as new blocks enter the viewport. The existing viewport-jump, anchor, focus and reduced-motion paths keep text readable immediately.

The regression test advances 120 px per rendered frame and checks all 12 sampled paragraphs start exactly once in order. On the previous implementation, only four of those paragraphs started. Compare the same wheel sequence against a production build of the original article, and verify the recent reload and position-restoration cases.

## Verification

- The production-build preview of the original article played all 31 eligible blocks in document order in both Chromium and WebKit under the same successive wheel sequence. The moderate wheel control played all 23 eligible blocks.
- All 34 focused Playwright cases passed. The new test passed three more runs with an explicit viewport check for the sampled paragraphs.
- The previous reader implementation remains the code-only rollback.

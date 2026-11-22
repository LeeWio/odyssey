# READER-MOTION-002

## Problem

On the live reader at revision `d6330b0`, six 120 px wheel events after reloading `/single/memories-of-grandpa` skipped the reveal of all 15 newly eligible blocks. Twelve 60 px wheel events over the same distance played all 15. Restoring the viewport also skipped new motion during the first 160 ms. With client scripts delayed, an early scroll to 120 px was reset to 0 when the app restored the saved offset.

## Design and acceptance

- Retain the server-rendered article, the first-paint mask, and the WAAPI keyframes and stagger documented in READER-MOTION-001.
- Advance the ordered queue as the viewport moves. Settle a non-overlapping viewport or explicit heading jump immediately. Bound the number of visible blocks waiting to start during continuous scrolling.
- Treat the first viewport of a resumed or interrupted opening as already readable. Keep subsequent blocks eligible for animation on the next scroll.
- Let the browser keep a restored position. The startup script offers a saved positive offset only when needed. User input or an actual position change cancels the fallback before hydration.
- Verify top and mid-article reloads, scroll input before hydration, ordinary wheel input and mobile touch input, explicit navigation, reduced motion, and script-free readability. The previous reveal implementation remains a code-only rollback.

## Local verification

- The production build rendered the original 325-block article from a loopback API snapshot. Across repeated six-step 120 px wheel runs, Chromium completed 15 reveals and WebKit completed 14–15. The visible queue limit settled one block in the faster WebKit run. Both engines recorded zero premature animation cancellations. During delayed top reloads, both retained the user's 120 px offset and played subsequent reveals.
- All 33 focused Playwright cases passed. The suite covers scroll input on the first frame, layout changes after reload, the positive-offset fallback, input during pending hydration, mobile touch, readable jumps, reduced motion, and script-free rendering.
- Three supplemental outline fixture cases and five library-history cases failed on both the patch and the original `d6330b0` baseline. The real reader's mobile heading navigation passed in the focused suite.

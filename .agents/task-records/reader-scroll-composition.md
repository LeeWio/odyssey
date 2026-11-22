# Reader scroll performance (READER-MOTION-006)

## Discovery

The reported stutter affects `/single/[slug]`. The live health route and `origin/main` identified revision `5f38d699`. The two reference articles are _后来，我开始写爷爷_ and _人是无法享受孤独的_. The earlier animation work established native keyframes, document-order starts, restored-viewport animation and reduced-motion support.

A Chromium trace with 4× CPU slowdown reproduced main-thread work on the live page. Over 20 scroll steps and 3,200 px, the article page rendered 19 times. The compact navbar width changed and triggered layout and paint between scroll updates. Freezing the width in the control run reduced 150–152 layouts to 12 during the same 1,152 px desktop sequence. Width stabilization produced the largest change among the interventions, which also isolated the logo, the background and reveal blur. Evidence is in `/tmp/odyssey-reader-scroll.DI4T4U/`.

A follow-up on the same two articles found that a 36 px wheel step could start a reveal 70–71 px below the viewport in Chromium and WebKit. After a 940 ms pause the paragraph was already at opacity 1. Chromium's rapid wheel jump started new 680 ms reveals at 102 ms with a 2.25× playback rate. See `entry-baseline.jsonl` in the same evidence directory.

## Design and acceptance

- Derive compact navigation width from the intrinsic widths of the controls. Measure when those controls change size or the viewport resizes. Keep the existing width transition, glass treatment and logo.
- Keep the scroll percentage local to the article action toolbar and continue passing it to the reading checkpoint hook for authenticated readers.
- Start new scroll reveals in document order once the leading edge is 16 px inside the viewport, giving the first line room to move upward into view. A visible group starts in the same frame and plays the original native keyframes at their authored speed. Keep the stagger for the opening or restored viewport and release its queue on scroll. Resize and intersections also wake the scheduler when layout shifts.
- Verify the timing with a slow wheel approach and a fast burst. Preserve text and image keyframes, document order, reload and anchor handling, and reduced-motion behavior. Profile the full-speed gesture against the performance-only build to check the cost of overlapping native animations.
- Compare identical gestures before and after with the production build. Verify width stabilization, ordinary and fast wheel, mobile touch, keyboard and reading-list behavior. Roll back through a revert and the standard deployment workflow.

## Performance isolation

These results isolate navigation measurement, progress state, and scheduling in the performance-only preview. Each row gives medians from three paired runs on the same Chromium host with 4× CPU slowdown. The reference articles and images came from the same local public-content snapshots.

| Scroll scenario                                   | P95 frame interval, before → after | Main-thread time, before → after | Layouts, before → after |
| ------------------------------------------------- | ---------------------------------- | -------------------------------- | ----------------------- |
| 1,152 px on _后来，我开始写爷爷_                  | 9.3 → 9.2 ms                       | 1,044 → 598 ms                   | 146 → 12                |
| 3,200 px on _后来，我开始写爷爷_                  | 33.7 → 9.3 ms                      | 946 → 507 ms                     | 90 → 18                 |
| 1,920 px on _人是无法享受孤独的_, mobile viewport | 16.7 → 9.2 ms                      | 619 → 404 ms                     | 14 → 14                 |
| 3,200 px in a 2,048-paragraph fixture             | 17.5 → 16.2 ms                     | 866 → 682 ms                     | 102 → 18                |

- The three fast-scroll runs on the reference article produced 12 frame intervals over 33.4 ms before the change and zero in the preview.
- A separate run counted 18 article-page renders before and zero after a 3,200 px scroll. Ordinary scrolling measured 755 pending-block rectangles before and 276 after. Source traces are in `benchmark.jsonl` and `counters.jsonl` in the evidence directory above.
- The compact navigation held its measured width across 48 consecutive frames at 390, 1,024 and 1,280 px in Chromium and WebKit, with the home logo at its intended 30 px size. The new browser regression failed against the original build and passed against the preview.

## Final preview verification

- In Chromium and WebKit on both reference articles, a slow wheel operation left the paragraph pending during a 940 ms pause below the fold. The sampled paragraphs started at 17–18 px of overlap and were visibly fading in while the wheel was stationary. Each of the 11 newly entering blocks in every 600 px wheel jump started at 0 ms and 1×. See `entry-comparison.jsonl`.
- A Chromium wheel burst and touch fling started 63 of 63 and 28 of 28 qualifying blocks respectively. A WebKit wheel burst and reversal started 29 blocks in order. The next block peaked at 14.42 px of overlap just before reversal and stayed pending. Starts were ordered and unique. The landing viewports settled fully. See `viewport-gestures-checked.jsonl`.
- Three paired 3,200 px wheel runs at 4× CPU slowdown yielded median P95 frame intervals of 25.6 ms on the baseline, 17.0 ms for the performance-only build, and 18.2 ms for the final preview. The corresponding median layout counts were 49, 10, and 0. Each final-preview run retained one 40.7–42.1 ms interval at gesture onset. At normal CPU speed the three P95 values were 17.3–17.4 ms, with maxima of 25.1–33.4 ms. See `viewport-wheel-benchmark.jsonl` and `viewport-wheel-unthrottled.jsonl`.
- `bun run preflight` passed formatting, lint, TypeScript and 455 unit tests. `bun run build` and all 19 browser smoke cases passed. The slow and fast wheel assertions failed against the original build as expected. The pinned OpenAPI coverage check matched 319 frontend operations.
- The focused suite passed 51 of 59 cases, including all reader entrance, restoration, mobile outline, sharing, collection, and save-for-later coverage. The three rich-text editor outline cases and five library-history cases reproduced on the baseline. The signed-in search journey saved a chapter and resumed there from the library. See `viewport-focused.log`, `baseline-additional.log`, `viewport-library-baseline.log`, and `viewport-search.log`.
- AI self-review compared the navigation, checkpoint handling, reveal lifecycle and regressions with `5f38d699`. Opening stays bounded by the existing guard, the ordered scan batches geometry reads before writes, and cleanup restores readability. Physical device measurements remain outside this comparison.

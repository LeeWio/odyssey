# READER-MOTION-004

Refine the GSAP reveal and play each visible content block in document order after refresh and during forward scrolling. The user approved the preview and authorized opening a pull request from the local checkout.

## Design

The live page runs opacity, blur, and transform on the same 680 ms easing curve. Its 90 ms opening stagger and per-block entrance establish the reading rhythm. The scroll-position-only prototype held multiple partially revealed paragraphs at the viewport edge after the reader stopped.

Each semantic block now has a GSAP timeline with independent opacity, sharpening, and travel. Text uses a 340 ms fade, 390 ms blur recovery, and 680 ms eased travel from 16 px at its natural scale. Figures have a longer settle and a slight zoom. Text reaches readable contrast while the last few pixels of travel are still visible. Finished and interrupted timelines restore the original styles.

A reload restores the saved position before choosing the intersecting blocks. Nearby images without reserved dimensions and loading fonts can change that selection, so the entrance waits for them within the existing opening guard. Input or an expired guard makes the body readable immediately. Headings, paragraphs, and grouped rich-text blocks share one document-order cursor and one frame callback. A resumed viewport staggers its visible blocks within a 270 ms start window, with a lighter fade for very tall surfaces.

Forward travel of 360 px within 160 ms starts visible blocks in document order within the current frame. Those timelines start at 15% progress and play at 2.25 times their normal rate. Ordinary scrolling and the top opening retain their stagger. The local service uses public article snapshots and the same public pictures as the live article.

## Preview verification

- `bun run build` and `bun run preflight` passed. Preflight ran 454 unit tests.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3253 bun run test:e2e tests/e2e/article-entrance.spec.ts tests/e2e/article-mobile.spec.ts tests/e2e/article-reading-list.spec.ts` passed 37 tests against the same build now serving port 3250. The added checks cover a clipped first paragraph and a delayed image above the restored viewport.
- On the same paragraph and scroll positions, opacity reached 0.94 and blur dropped below 0.75 px in 208 ms in the preview and 274 ms on the live page. At that sample the preview had 3.65 px of its upward movement left. Actual browser samples are in `/tmp/odyssey-reader-preview.yBm2tg/gsap-polish-comparison.log`.
- Before the sequencing changes, Chromium started zero of 16 visible blocks after a middle refresh and one of 13 during the six-step fast scroll. The final preview started all 16 and all 13 in order. The native position, regular scroll, and mixed-speed runs passed in Chromium and WebKit on both reference articles. Each observed start was unique and every sampled block returned to its resting styles. The animation-window P95 frame intervals ranged from 9.4 to 20 ms across these runs. The longest interval was 34 ms in the mixed-speed WebKit run. The per-block trace is in `/tmp/odyssey-reader-preview.yBm2tg/reader-sequence-verified.jsonl`.

## Pull request verification

The task is ready for review. The four runtime and test diffs match the approved preview after updating the base to `f34a169a` on `main`.

- `bun run preflight` passed formatting, lint, type checking, and all 454 unit tests on the updated base.
- `bun run build` passed on the updated base. The focused Playwright command above passed all 37 tests against that production build.
- AI self-review covered the opening guard, restored scroll position, document-order scheduling, GSAP cleanup, and the regression tests. It found no blocking issues. The real-article replay used a local preview in desktop Chromium and WebKit. The focused suite also ran Chromium mobile emulation.
- Revert the PR to restore the previous reader animation. The change requires no content migration.

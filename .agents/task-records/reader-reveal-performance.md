# READER-MOTION-005

Keep the reading animation approved in READER-MOTION-004 while addressing the stutter reported on production during fast scrolling. Compare the preview with production revision `4da1ad88` and release the change after gesture verification and repository checks pass.

## Diagnosis

On the same article and Chromium with 4× CPU slowdown, a 3,200 px scroll over 20 animation frames raised the median run's P95 frame interval from 24.5 ms before PR 122 to 32.7 ms with its GSAP renderer. Normal desktop scrolling stayed near 9 ms. The GSAP renderer created three tweens for each ordinary block and kept updating styles on blocks that had already left the viewport. The cold article loaded an additional 27.5 KB of compressed JavaScript.

Nearby images without reserved dimensions can independently delay the start after a middle refresh. With a 900 ms delay injected for one image, the body stayed hidden for about one second. A longer delay reached the existing 2.2 s guard.

## Design

Keep the document-order scheduler, restoration, normal stagger, fast-start phase and rate, and reduced-motion handling. Give the browser one native animation per block with the existing opacity, blur, and travel durations. The travel uses the same sampled quartic curve whether the browser supports CSS `linear()` or needs individual transform keyframes.

The fast-scroll comparison keeps the entire visual effect. In Chromium and WebKit, 201 samples per profile placed the largest translation difference at 0.023 CSS pixels and the largest blur difference below 0.0001 CSS pixels. This included the transform keyframe fallback.

## Verification

- Three matched runs on the final production build lowered the sustained fast scroll's median P95 frame interval from 32.7 ms to 17.1 ms. Across those runs, intervals above 33.4 ms fell from seven to zero. Cold article JavaScript fell by 26 KB compressed. See `/tmp/odyssey-reader-perf.SMSYZg/final-perf.jsonl` and `/tmp/odyssey-reader-perf.SMSYZg/final-parity.jsonl`.
- `bun run preflight` passed formatting, lint, type checking, and 454 unit tests. `bun run build` passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3263 bun run test:e2e tests/e2e/article-entrance.spec.ts tests/e2e/article-mobile.spec.ts tests/e2e/article-reading-list.spec.ts` passed all 37 tests. The tests record native animation starts and sample computed styles while text moves.
- Six replays across the two reference articles in Chromium and WebKit recorded ordered starts with full viewport coverage and no duplicates. The local trace is `/tmp/odyssey-reader-perf.SMSYZg/final-order.jsonl`.
- Actual browser input covered a 3,200 px Chromium wheel burst, a Chromium touch gesture with about 2,740 px of travel including inertia, and a WebKit wheel burst followed immediately by reversal. The preview started all 63, 28, and 30 newly visible blocks respectively, once each in document order. The landing viewports had no pending blocks or residual animated styles. The probe used live layout positions to account for shifts as an image loaded. See `/tmp/odyssey-reader-perf.SMSYZg/gesture-audit.jsonl`.
- `OPENAPI_FILE=contracts/nexus-openapi.operations.json bun run api:coverage` matched all 319 frontend operations.
- Revert the rendering change to restore the GSAP timelines. The change requires no data migration.

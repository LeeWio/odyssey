# READER-MOTION-001: restore public article motion

Status: READY_FOR_REVIEW. Scope: Odyssey public article body only. No change to Nexus, editor UI, the article hero, or article data contracts. The user authorized publication after the first-paint follow-up.

## Discovery and design

- `4200d98` introduced ordered, semantic MotionKit reveals in the read-only editor, and `2e6217d` lengthened their pacing. `ee1a4af` (PR #92) moved the article to a server-rendered static document. This retained readable HTML and removed public editor hydration, but the replacement played only an 8 px translation on initially offscreen direct children. The regression checks verified visibility rather than whether anything actually animated.
- The user approved the Thursday revision `7618f1e` after inspecting the actual article `123123-123123123123`. Match its 90 ms document-order stagger, 80 px lead, 680 ms text reveal (opacity, 8 px blur, 18 px translation, 0.99 scale), and 780 ms image reveal (6 px blur, 1.025 scale). The local experiment's separate light opening preset and independent viewport triggers are not the reference.
- Keep the static SSR tree and outline. Use one IntersectionObserver on the next unit and one native Web Animation per active unit; the DOM is already rendered and does not need a React motion wrapper or an editor instance. Pending blocks are visually transparent only after hydration, preserving layout, search, and focus. List items and table rows animate individually. Parallel columns are one unit so a long column cannot conceal a short neighbor. Surfaces taller than two viewports are not blurred.
- Fast jumps and focus clear the visible backlog and cancel active effects. A direct anchor or restored reading position skips visible effects at startup. Reduced motion clears the entire queue without re-hiding content if the setting changes back. Key the lifecycle by article slug so client navigation cannot reuse an observer from a previous document.

## Acceptance and rollback

Compare opening and normal scroll on the same local article against Thursday in Chromium. Verify the keyframes, document order, nested units, rapid navigation, restored position, direct anchors, reduced motion, and SSR without JavaScript. Preview a local production build against the Docker API without replacing Thursday's server. No dependencies or API contracts change. Reverting the scoped change restores the previous static reader behavior without a migration.

## Local evidence

- PASS: focused Prettier and ESLint, `git diff --check`, `bun run typecheck`, and `bun run test:unit` (454 tests). The unrelated pre-existing `tsconfig.json` change is outside this task.
- PASS: `bun x playwright test tests/e2e/article-entrance.spec.ts tests/e2e/article-mobile.spec.ts` (21 tests). Covers ordered text and media keyframes, nested units, saved scroll, hash anchors, reduced motion, and JavaScript disabled.
- PASS: `bun run build` in an isolated snapshot. Both the historical preview on port 3219 and the production-build candidate on port 3220 returned HTTP 200 for the same Docker-backed article.
- PASS: real-article Chromium comparison at 1440×1050 and 390×844. Both versions rendered the same 88 blocks. Desktop opening revealed blocks 1–11 on Thursday and 1–12 in the candidate; slow scrolling reached block 33 in both. Mobile opening revealed 1–6 and slow scrolling reached block 19 in both. Keyframes matched, and a fast jump to the 71st paragraph gave full opacity without waiting. The candidate has no Tiptap editor in the body. Trace: `/tmp/odyssey-reader-review.TceAGK/real-article-comparison.json`.
- This intermediate preview was not published. The final delivery includes the first-paint follow-up.

## First-paint follow-up

- The first local candidate painted all 10 in-view blocks at 74 ms and hid them at 116 ms on a normal reload. Delaying its client assets confirmed that the server HTML was already visible when the motion controller added the pending states.
- A fixed, article-scoped inline script now gates the body's first paint before the browser parses its paragraphs. The motion controller takes over in one frame without changing the approved animation, and uses the existing SSR DOM. It skips an already-visible opening if startup exceeds 2200 ms or is interrupted. Anchors, resumed positions, reduced motion, and disabled or blocked scripts remain readable; no editor bundle is reintroduced.
- PASS: production snapshot and the actual Docker-backed article on port 3221. No visible text frame before animation on ordinary reload or desktop/mobile reloads with the external scripts held for 850 ms. The first three units start in order with 680 ms keyframes. With scripts held for 2600 ms, the visible viewport remains visible after hydration. Reduced-motion and JavaScript-disabled runs remain readable. Evidence: `/tmp/odyssey-reader-first-paint.uvncef/real-first-paint.json`.
- PASS: scoped Prettier and ESLint, `git diff --check`, TypeScript, all 454 unit tests, and 23 desktop and mobile article Playwright tests, including the slow-reload and startup-timeout regressions.

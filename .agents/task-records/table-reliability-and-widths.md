# TABLE-RELIABILITY-2026-11-28

State: READY_FOR_REVIEW. Base: v1.270.1 / 7b6c15d7. Isolated branch: feat/table-reliability-and-widths.

User authorizes implementing the four-stage next-iteration plan, with the Header row/column indicator fix first. Keep existing 4px controls and native Color/Alignment submenus. Preserve existing state and required gates. Latest user-supplied AGENTS explicitly requires commits/pushes on production checkout via targeted git patches; this latest instruction supersedes prior local-Git preference for this turn. Heavy checks and visual preview remain local.

Discovery: Header ItemIndicator adds native start padding, shifting its icon relative to the other items. Remove only this indicator, preserve controlled native section selection and ARIA checked state, and apply the native hover background token `bg-default` through data-selected. HeroUI MCP docs/CSS queried; menu-item CSS not served by MCP, so installed package inspected: native selected state only animates indicators, while hover uses bg-default. No new CSS file or custom palette.

Scope: typed clipboard failure and extension callback/UI Toast; merge-safe selected-column distribution/reset; keyboard/live selection and action feedback; measured 50x20/200x20 performance and focused controller extraction as evidence warrants. Tests cover parser/allocation thresholds, single-undo commands, persisted HTML/JSON, selection, modal focus, touch, native submenus and themes. Real Excel/Numbers/Sheets capture and VoiceOver/NVDA require actual applications/devices; report limitations accurately instead of manufacturing evidence. No formulas, database filters, virtualization or new color panel.

Column-width contract: selected logical columns only, expanded to complete merged boundaries by existing band selection. Distribution preserves selected rendered total and enforces configured cell minimum. Reset clears explicit widths only in selected columns (zero slots for merged vectors containing other explicit columns; all-zero vectors become null). Mutate document attrs, never only DOM; one command/one undo. Columns outside the selection remain unchanged.

Clipboard contract: non-applicable text delegates; recognized invalid or over-limit TSV is handled without a document write and reports a typed reason. Parser and resulting expanded grid have independent caps. Callback remains in pure extension; editor owns HeroUI Toast and persistent accessible feedback.

Validation and review/delivery evidence will be recorded as work proceeds. Rollback: scoped revert, no data migration.

## Implementation and review

Header items retain native `selectedKeys` / menuitemcheckbox semantics, omit ItemIndicator entirely and use `data-[selected=true]:bg-default`. Browser assertions compare the active background with a neighboring hovered item and compare settled icon positions. The previous batch-row test now asserts indicator absence, matching the new requirement.

`parseTableText` now returns a discriminated result. Recognized rejection consumes the paste, dispatches only non-history metadata and invokes optional editor-local `TableKit.configure({onPasteRejected})`; no document steps, fallback insertion or undo entry. `TableFeedback` owns the HeroUI warning Toast and persistent live status. Repeated identical errors are deduplicated. Ordinary text, code blocks and native rich-HTML paste remain delegated. Allocation limits apply both to padded parsed input and expanded destination size.

Selected-column distribute/reset actions update every affected cell's colwidth vector, including colspan/rowspan, preserve unselected tracks and isolate undo. Distribution measures the current rendered tracks only on execution; capability checks use the canonical first-row vector, matching Tiptap TableView. Zero-size layout falls back to persisted widths and configured minimum. Integer remainder pixels preserve the selected total. The shared `column-layout.ts` retains the existing WebKit zero-width COL fallback. The command walks logical tracks without repeated whole-map index searches.

Selection/status messages describe rows, columns, cell rectangles and whole tables. Menu, drag move and append results publish non-history status. Feedback is scoped to each editor, retains the native table structure and avoids state updates for unchanged text. A dual-editor fixture verifies independent Escape, submenu focus, selected range and rejection state. `TableActionHandle` / `TableAppendHandle` consolidate chrome, hit targets, tooltip, keyboard labels and native portals; gesture/selection ownership remains in the controller.

## Performance evidence

Local indicative profile: Apple M1 Max / arm64, Chromium 151, viewport 1280x900, reduced motion, local dev build. Twelve selection changes per 50x20 and 200x20 table, typing seven characters, native column resize and edge auto-scroll; raw results `/tmp/table-next-profile-before.json` and `/tmp/table-next-profile-after.json`. These are development measurements, not production latency guarantees.

| Stage                    | Rows x columns | Median selection dispatch | First layout read cost | Warm layout max | Rect reads / selection |
| ------------------------ | -------------- | ------------------------- | ---------------------- | --------------- | ---------------------- |
| Before handle extraction | 50x20          | 3.35ms                    | 0.1ms                  | 0.1ms           | 27                     |
| Before handle extraction | 200x20         | 5.4ms                     | 56.3ms                 | 0.1ms           | 27                     |
| After handle extraction  | 50x20          | 3.1ms                     | 14.8ms                 | 0.1ms           | 27                     |
| After handle extraction  | 200x20         | 4.6ms                     | 58.8ms                 | 0.1ms           | 27                     |

Typing and resize completed, edge drag produced positive horizontal scroll for both sizes. Warm measurements do not justify a new geometry cache: reads are already batched per animation frame and do not grow with row count. Cold 200x20 layout still exceeds one frame; this is explicitly unresolved, not represented as fixed by extraction. No caching, virtualization or broad layout rewrite introduced. Avoid attributing the small timing differences to an optimization; run-to-run variation and concurrent local load apply.

## Quality and scope limits

Final preflight PASS: 534 tests / 100 files, Prettier, ESLint and TypeScript (`/tmp/table-next-preflight-final.log`). Final production build PASS (`/tmp/table-next-build-final.log`). Final production Chromium: 48 PASS (`/tmp/table-next-final2-chromium.log`), covering table, glass and typography. Final production WebKit: 41 PASS (`/tmp/table-next-final2-webkit.log`), covering table and typography. Six new browser scenarios include dual-editor isolation. Responsive/theme captures completed at 390/768/1280, glass light/dark and square brutalism (`/tmp/table-next-final-visual/`). No blocking scoped review findings remain.

Actual in-app preview checked for header checked state, background and icon layout, native submenus and action status. Additional light/dark/shape and viewport captures are checked before delivery. Real Excel/Numbers/Google Sheets clipboard captures and VoiceOver/NVDA are not performed: synthetic HTML/TSV, browser keyboard/ARIA and touch simulation are the available evidence. Broader WebKit glass pixel blur probes remain outside this table implementation and are not claimed passing.

Separate self-review: inspected extension purity, allocation bounds, stale selection/document guards, undo, merged geometry, public-reader schema, focus scope, native ARIA state, callback isolation, scope, API compatibility and command complexity. No schema migration, new dependency or CSS-file changes. The parser return type intentionally changes its internal API; repository consumers/tests are updated. Final head/CI/platform review and live revision will be recorded in the PR.

Server publication uses the isolated linked checkout `/srv/blog/apps/web-table-reliability` created from `/srv/blog/apps/web` at the reviewed base. The original server checkout remains on its existing `fix/post-translation-save` branch without changes. Transfer is a targeted Git patch, apply --check then apply; all commits and pushes originate on that server, as the latest AGENTS requires.

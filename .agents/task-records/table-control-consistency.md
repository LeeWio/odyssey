# TABLE-CONTROLS-2026-11-28

State: READY_FOR_REVIEW

## Discovery and scope

Isolated `fix/table-control-consistency` from v1.270.0 (`4ea6d428`). User requests the six-dot cell handle centered on the selection's right border, symmetric top/left axis handles and bottom/right append controls, and HeroUI-consistent interactions. Latest direction explicitly halves the proposed gap from 8px to **4px**, restores native Color/Alignment cascading submenus, removes **all Back-page navigation**, and requests a separate next-iteration development plan. Earlier spreadsheet delivery is complete through #205/#206. Local Git and end-to-end delivery authorization persists; required platform gates remain enforced.

Read repository/governance and design guidance, user-invoked heroui-pro-design-taste, HeroUI MCP component docs/CSS, installed Tiptap 3.34.0 behavior and references. Existing dependency versions and persisted schema remain unchanged. Public article spacing is preserved.

## Acceptance and implementation

- All four outer rails use 16px visual thickness and a 4px gap from the wrapper boundary. Editable tables reserve 20px margins to fit those controls, including first-node tables. Rails hide when their exterior gutter is clipped instead of being clamped into the grid.
- Six-dot grip straddles the actual selection's right edge at its actual vertical midpoint. Clipped edges hide the grip; keyboard Shift+F10 reveals the real anchor before opening. Native column resizing remains available beside the grip.
- Explicit flex alignment removes inherited inline baseline drift. Control SVGs use 12px size and zero native SVG margin within the thin rails; Button retains native secondary variant/chrome. Transparent 4px hit extensions provide 24px targets; the cell grip has priority where targets meet. Every icon-only control has a HeroUI Tooltip.
- Native Dropdown.SubmenuTrigger / Popover / radio sections implement Color and Alignment on desktop and touch. On narrow screens, native bottom-start placement keeps the child inside the viewport. No Back-page state or Back item remains.
- Root Escape is owned by the persistent table controller and scoped to that editor's root menu with useId; portaled native children retain their own Escape/ArrowLeft handling. Dismissal restores the model CellSelection after native focus restoration, preventing intermittent touch dismissal from collapsing the caret to the document start. Document-change and destroy guards prevent restoring stale selections.
- Unavailable merge/split groups are omitted; batch clear labels identify the range explicitly.
- Typography regression now asserts the deliberate edit=20px/read=16px table margin distinction while still comparing all other block metrics.

## Verification evidence

Final production build and full applicable checks completed. Exact logs are local `/tmp/table-controls-*`; screenshots in `/tmp/table-controls-final-review/` and `/tmp/table-controls-final-visual/`.

- Preflight: PASS, formatting + ESLint + TypeScript + 526 unit tests / 99 files (`table-controls-final-preflight.log`); final dismissal revision also passes in `table-controls-final-preflight2.log`.
- Production build: PASS on final source (`table-controls-final-build2.log`).
- Native submenu/Shift-click targeted cases: 5 PASS at 320/390/1280.
- Visual review: actual in-app browser four-edge layout and native Color submenu; Chromium/WebKit screenshots at 390/768/1280, glass light/dark and square brutalism. Tooltip hover verified. No CSS-file changes.
- Initial expanded production run exposed and fixed expected typography metric differences and an intermittent 320px touch selection reset. Neither failure is omitted from the evidence. Final production Chromium run: **42 PASS** (`table-controls-final-chromium2.log`), including all table, glass and typography tests. Final WebKit table + typography run: **35 PASS** (`table-controls-final-webkit2.log`). Touch dismissal stress: **12 PASS** across 320/390px (`table-controls-dismiss-repeat.log`).
- Expanded WebKit pixel blur checks FAIL on text/menu blur probes before table interaction; these are outside the modified table code and are not claimed passing. The supported CI Chromium glass probes passed. One Chromium typography-menu focus timing failure passed three isolated repeats; keep recorded as a broader editor test limitation.

## Separate AI review

Reviewer: same Codex agent, separate final-diff pass. Base `4ea6d428`; head will be recorded in PR review. Reviewed selection ownership, document mapping, scroll clipping, focus/keyboard/touch/menu portals, native resize, theme behavior, layout and regression scope. No schema migration, dependency, API or content changes. No blocking finding remains after the dismissal fix, with final applicable checks passing. Actual VoiceOver/NVDA and real mobile OS software-keyboard behavior are untested; browser touch simulation is not equivalent to either.

Broader findings and staged acceptance criteria are in [table-next-iteration-plan.md](table-next-iteration-plan.md). They are proposals only. Rollback: revert the scoped application commit through a PR and redeploy the previous revision. Platform, PR, release and production verification evidence will be appended after delivery.

# Odyssey HeroUI component audit — UI-20261121

Status: READY_FOR_REVIEW. Base: `0428fb0` (`origin/main`). Odyssey owns the frontend; Nexus contains no HeroUI imports. The existing reader worktree and its local TypeScript configuration are excluded.

## Design and acceptance

- Scan tracked TypeScript imports and JSX slots across the app, shared components, feature modules and playgrounds. Verify motion-wrapped HeroUI components against their underlying primitives.
- Review API and CSS per imported component family in HeroUI MCP. Use the installed, lockfile-resolved HeroUI declarations and CSS when the MCP catalog cannot answer, not speculative substitutions.
- Remove styling that merely redefines primitive chrome, prefer documented variants and parts, and keep page layout, semantic states, intentional image-edge composition, editor NodeView styling and approved reader motion. No backend, dependency, global theme CSS, routing or content schema changes.
- Verify keyboard/focus behavior for menu and popover triggers, responsive homepage and article cards, and the production image revision. Rollback is a revert of the scoped PR through the standard production workflow.

## Evidence

- Initial import/JSX pass: 308 tracked TypeScript files with runtime named imports, 5,644 directly resolved JSX usages and 485 distinct tags including compound slots. Motion wrapper and utility references were inspected separately.
- MCP component API and CSS queried for 102 families. Both queries lacked 36 families: `accordion`, `alert-dialog`, `autocomplete`, `avatar`, `breadcrumbs`, `card`, `checkbox`, `description`, `field-error`, `form`, `header`, `i18n-provider`, `input`, `input-group`, `input-otp`, `kbd`, `label`, `link`, `virtualizer`, `modal`, `pagination`, `popover`, `scroll-shadow`, `search-field`, `select`, `separator`, `sheet`, `spinner`, `surface`, `tabs`, `tag`, `text-area`, `text-field`, `toast`, `tooltip`, `typography`. OSS source lookup returned the same misses; types and distributed default styles from `@heroui/react` and `@heroui/styles` were used for those families. Provider and layout utilities without their own styles have no standalone CSS.
- Implementation order: native/default props; Card and KPI surfaces; Overlay, Tooltip and Editor compound parts; keyboard-action and theme verification. Preserve full-bleed media padding exceptions, skeleton silhouette sizes, data visualizations and typography hierarchy.
- Local preflight: formatting, ESLint, TypeScript, and 453 unit tests pass. Production build succeeds.
- Chromium: homepage, friend links, orientation, guestbook, Chronicle queries, and journal layout and themes exercised. Manual keyboard checks opened and dismissed the language menu and guestbook dialog, restored focus, and expanded FAQ at 390 and 1440 pixels. The non-smoke columns layout test has the same 358 px vs. 390 px container assertion on unchanged `0428fb0` and this branch.
- Authenticated Chromium fixture: the guestbook description is associated with its field. The permission tree checkbox toggles its descendants without expanding the disclosure; the separate disclosure expands by keyboard without changing selection. No production data was used.
- Compound check: `Checkbox.Content` and `Switch.Content` must wrap their controls; they render the real inputs. Corrected this in permissions, tracker, webhook settings, friend links and the pulse-heart playground. Reviewed the other existing Checkbox and Switch call sites.
- AI self-review: scoped diff only; no dependencies, secrets, API, route or editor motion changes. No live authenticated publishing journey was exercised.

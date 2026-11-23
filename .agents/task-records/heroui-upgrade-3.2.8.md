# Upgrade HeroUI React and Pro (HEROUI-0328)

## Discovery and scope

The checkout starts from `94d10867` on protected `main`. The original worktree holds the independent homepage change. npm's public `latest` tags identify `@heroui/react` and `@heroui/styles` 3.2.8 and `@heroui-pro/react` 1.0.0-beta.11. The app already runs React 19 and Tailwind CSS v4 with the documented stylesheet order. Bun 1.3.14 is the project toolchain.

HeroUI 3.2.8 updates overlays, collection choices, table column resizing, scroll shadow, and Tailwind Variants. Check installed Pro peers against the updated core and keep dependency resolution scoped to this upgrade. Build the existing Pro themes with the repository generator. Adjust component usage only where verification identifies a compatibility regression.

## Acceptance

Verify the three resolved versions, rebuild the production bundle, and run preflight, security audit, and browser smoke. Exercise representative OSS and Pro interactions, including stacked overlays, keyboard collections, and responsive themes. Record CI, release, and production smoke evidence. Roll back by reverting the dependency update and using the normal deploy workflow.

## Dependency resolution

Pro beta.11 raises its React Stately minimum to 3.51.0. Install that version at the root to share it with the current React Aria packages. Keep Pro on Tailwind Variants 3.3.1 because its TextShimmer still passes a custom merge configuration through the v3 entry point. The two OSS packages resolve their own 4.0.2 dependency. All 41 declared HeroUI peer ranges are satisfied. The existing theme generator refreshes the three checked-in Pro themes with their selectors scoped to the active theme.

## Local verification

- PASS: Bun 1.3.14 frozen install, `bun run preflight` with 457 unit tests, `bun run build`, high-severity Bun audit and all 19 Chromium smoke tests.
- PASS: 319 of 319 operations match the pinned Nexus OpenAPI projection. Four layout checks cover the homepage at 390, 1440 and 1920 px and all six reader theme and mode combinations at 390 px.
- Focused Playwright passed 21 of 30 cases. Three archive and columns assertions and six rich-text cases reproduced with the same failure details on the earlier HeroUI build from the same base. Passing checks include sign-in modal focus, comment sheet touch drag at 320 and 390 px, mobile outline selection, share actions, and editor modal focus.
- AI self-review compared the direct dependency and peer changes, lockfile resolution, and generated theme selectors with `94d10867`. The generated diff changes vendor theme rules. It contains no application component or backend edits.

# Conventions

## Naming

- Use domain names that match the product language.
- Keep route and feature names consistent across code and docs.
- Files and directories use kebab-case. Next.js route files keep their reserved names.
- React components use PascalCase and named exports.
- Hooks start with `use`. Functions and variables use camelCase.
- Types and interfaces use PascalCase. Props types are named `<Component>Props`.
- Constants that never change use UPPER_SNAKE_CASE. RTK Query APIs end with `Api`, slices end with `Slice`.
- Tests sit next to the module they cover and end with `.test.ts`.

## Boundaries

- `app/` owns routing and page composition.
- `features/<domain>/` owns a domain that has its own pages, data, and UI.
- `components/` owns UI reused by more than one feature. A component used by one page stays with that page or feature.
- `components/ui/` owns project-level primitives. `components/layout/` owns shells reused across pages.
- `lib/features/` owns domain state, data access, and business logic.
- `hooks/` owns behavior reused across features. A hook used by one feature stays in that feature.

## Where new code goes

- A new route goes under `app/` and composes a feature. It does not fetch and render a whole domain inline.
- A new domain with its own data and screens goes under `features/<domain>/`, with API access in `lib/features/<domain>/`.
- Split a component when it owns a separate data flow or a separate interaction, not because a file is long.
- Promote a component to `components/` only after a second feature needs it.
- Extract a hook or helper only when the logic is reused or needs its own test.
- Server data stays in RTK Query. Page interaction stays in component state. Cross-page client state stays in Redux.
- Do not import another feature's private file. Use its public export.

## Hooks

- Prefer existing library hooks for timers, browser events, media queries, and other common behavior. This project already uses `@mantine/hooks`.
- Keep custom hooks focused on domain behavior or formatting; compose library hooks for lifecycle and cleanup.
- Check existing dependencies before adding a hooks library. Add another library only when the installed libraries cannot meet the requirement.

## UI Baseline

HeroUI is the default UI system for this repository.

### Hard Rules

- if HeroUI provides a supported component, use it instead of building a custom replacement
- do not replace HeroUI with raw HTML unless there is a documented exception
- do not introduce a custom UI primitive when an equivalent HeroUI primitive exists
- preserve HeroUI semantics, accessibility, and theming when wrapping or composing components

### Exception Rule

Any non-HeroUI UI primitive must be justified in a module note, ADR, or explicit implementation comment if the exception is temporary.

### Review Checks

- is there a HeroUI component that already solves this?
- does the implementation preserve HeroUI semantics and accessibility?
- if not using HeroUI, is the exception documented?

## Animation

Animation decisions must follow [Animation Design Specification](../04-design/animation.md).

### Hard Rules

- when the animated element is a HeroUI component, prefer `motion(HeroUIComponent)` instead of wrapping with ad-hoc DOM structure
- do not mix `motion/react`, GSAP, and CSS animation inside the same interaction unless the module documents a clear boundary
- default to `motion/react` for state-driven component motion
- default to CSS for local decorative effects, loading states, and micro-feedback
- use GSAP only when a timeline, scroll linkage, or complex orchestration is genuinely required
- do not add a second animation system to a module without updating the module docs or an ADR
- page changes use the shared `PageTransition` crossfade: enter `240ms` with `pageEaseOut`, exit `160ms` with `pageEaseIn`. Do not add a second route fade.
- section entrances reuse `lib/motion` (`createPageReveal`, `sectionPresence`, `pageFadeDuration`) instead of copying local fade helpers
- for short icon/button transitions, reuse `microEaseOut` (same curve as `pageEaseOut`)
- prefer `hooks/use-reduced-motion-preference` on hydration-sensitive surfaces so SSR defaults to reduced motion

### Code Review Checks

- animation should have a user-facing purpose
- animation should not delay core content
- animation should respect reduced-motion preferences
- animation should use transforms and opacity before layout-changing properties
- any GSAP usage should be justified in module documentation

### Current Migration Guidance

- keep current `motion/react` usage in navigation, page transitions, modal-like flows, and stateful components
- keep current CSS animations in skeletons, spinners, pulse indicators, and other decorative micro-effects
- keep current GSAP usage only in scroll-linked reading progress and timeline-heavy blog choreography unless the module is explicitly reworked

### Module Audit Notes

- HeroUI components in any module should be considered Motion-compatible by default unless a specific component limitation is documented
- `app/page.tsx`: mixed motion and CSS; acceptable only because the page combines component motion with lightweight decorative pulses and marquee-style effects
- `features/blog/auxiliary/reading-progress-bar.tsx`: GSAP is justified because it is scroll-linked and progress-driven
- `app/(main)/single/archive-timeline.tsx`: GSAP is justified because it is scroll-linked timeline choreography
- `components/music/*`: mostly `motion/react` plus CSS micro-effects; should stay on that path unless the interaction becomes scroll-driven
- `components/auth/dialog`: `motion/react` is the right default for modal/login transitions
- `features/blog/*` loaders and placeholders: CSS is appropriate and should stay simple

### Required Documentation

When a module introduces animation, document:

- chosen animation stack
- why the stack was selected
- which interactions are considered core
- which effects are decorative
- whether reduced-motion support is implemented

# Conventions

## Naming

- Use domain names that match the product language.
- Keep route and feature names consistent across code and docs.

## Boundaries

- `app/` owns routing and page composition.
- `components/` owns reusable UI and feature assemblies.
- `lib/features/` owns domain state, data access, and business logic.

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

Animation decisions must follow [Animation Design Specification](../04-design/animation-design-specification.md).

### Hard Rules

- when the animated element is a HeroUI component, prefer `motion(HeroUIComponent)` instead of wrapping with ad-hoc DOM structure
- do not mix `motion/react`, GSAP, and CSS animation inside the same interaction unless the module documents a clear boundary
- default to `motion/react` for state-driven component motion
- default to CSS for local decorative effects, loading states, and micro-feedback
- use GSAP only when a timeline, scroll linkage, or complex orchestration is genuinely required
- do not add a second animation system to a module without updating the module docs or an ADR

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
- `components/blog/reading-progress-bar.tsx`: GSAP is justified because it is scroll-linked and progress-driven
- `components/blog/chronicle-deck.tsx`: GSAP is justified because it is timeline-led and orchestrates a multi-card sequence
- `components/music/*`: mostly `motion/react` plus CSS micro-effects; should stay on that path unless the interaction becomes scroll-driven
- `components/auth/*`: `motion/react` is the right default for modal/login transitions
- `components/blog/*` loaders and placeholders: CSS is appropriate and should stay simple

### Required Documentation

When a module introduces animation, document:

- chosen animation stack
- why the stack was selected
- which interactions are considered core
- which effects are decorative
- whether reduced-motion support is implemented

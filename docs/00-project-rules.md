# Project Rules

This project uses HeroUI as the default UI baseline and `motion/react` as the default component-level animation system.

## Top-Level Rules

- Read the relevant Next.js and HeroUI v3 documentation before making implementation changes.
- Prefer HeroUI-supported components whenever a supported component exists.
- Use `motion/react` with HeroUI components by default for component-level animation.
- Use raw HTML, custom primitives, or GSAP only when there is a documented exception.
- Do not let exceptions become accidental defaults.

## What This Means

- If HeroUI supports it, use HeroUI.
- If a UI pattern can be composed from HeroUI, compose it there first.
- If animation is needed on a HeroUI component, prefer `motion(HeroUIComponent)`.
- If a module needs to step outside the baseline, document the reason in the module notes or an ADR.

## Review Rule

Before approving a UI or animation change, ask:

- Is there a HeroUI component for this?
- Does the implementation preserve semantics, accessibility, and theming?
- Is the animation stack the simplest one that fits the interaction?
- If this is an exception, is the exception documented?

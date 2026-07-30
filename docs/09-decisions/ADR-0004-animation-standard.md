# ADR-0004: Animation Standard

## Status

Accepted

## Context

The codebase currently uses multiple animation approaches:

- `motion/react` for many component and page interactions
- GSAP for some scroll-linked or timeline-driven experiences
- native CSS animation for lightweight loading and decorative effects

Without a standard, new modules may continue to mix these approaches arbitrarily, which makes the product feel inconsistent and harder to maintain.

## Decision

Use the following default hierarchy for animation:

1. `motion/react` for most component and state-driven UI motion
2. CSS animation and transitions for simple local effects
3. GSAP only for complex scroll-linked or timeline-heavy sequences

## Consequences

- future modules must choose an animation tool intentionally
- trivial effects should not bring in unnecessary complexity
- scroll choreography remains possible without becoming the default for every surface
- animation code should be documented at module level when it deviates from the default stack

# Design Brief: Odyssey Cyber Sanctuary

## Problem Statement

In the hyper-fragmented digital era, social spaces are overrun with ads, curated personas, and brief distractions. Users have lost the sanctuary to express their authentic selves and to form deep, meaningful connections.

**Odyssey** is a highly personalized "Cyber Sanctuary" and interactive digital monolith. It projects the founder's life slices—hardcore technical columns, raw mood snippets (Moments), investment tracking (Stock Ledger), curation lists (Jukebox), and a wandering travelers' Guestbook—into an immersive, cinematic parallax snapping canvas on the homepage, allowing users to deeply explore who the founder is and leave their own emotional footprint in a serene, non-intrusive way.

## Users & Ability Spectrum

- **The Founder (You)**: Needs a frictionless dashboard to quickly capture essays, momentary ideas, and personal curations without administrative fatigue.
- **Kindred Travelers**: Visitors seeking to explore the founder's world through calm, low-frequency interactions like reading, listening, and leaving emotional reactions.
- **Jordan (Low-vision / Zoom User)**: High contrast semantic tokens, distinct keyboard focus rings, and perfect responsive scaling at 200% zoom.
- **Marcus (Motor Impairment / Keyboard User)**: 100% keyboard-navigable parallax timeline using logical Tab snap-scrolling and generous touch targets (min 44x44px).
- **Priya (Cognitive / Non-native Reader)**: Highly structured content hierarchy, typographic balance (line heights, heading anchors), and clear non-verbose tooltips.

## Design Direction

- **Cinematic Scrolling Canvas**: The home page uses GSAP ScrollTrigger to snapshot different scenes. It scrolls like a continuous film reel—from a stellar welcome screen to moments sliders, floating tombstone charts, and finally a cozy Guestbook.
- **原位膨胀探索 (View Transitions)**: Clicking a card expands it gracefully in-place using React 19 View Transition API or Motion spring animation, avoiding any harsh white-flashes or layout jumps.
- **Physical Particle Reactions**: Clicking action/emotion reaction badges emits a burst of 15-25 micro-particles colored natively according to the active theme (Glass, Brutalism, Mouve).

## Constraints

- **100% Component Specification Compliance**: 100% built on HeroUI v3 Pro and OSS packages. Zero raw markup elements where HeroUI components are available.
- **Absolute Styling Integrity**: Strictly no hardcoded style overrides (like arbitrary Tailwind backgrounds, borders, or shadow classes). Rely completely on native semantic props or global theme tokens.
- **Motion Guardrails**: Proper cleanup on GSAP timeline unmounts to prevent memory leaks, with instant fallback to standard layouts if the user prefers reduced motion.

## Success Criteria

- **Fluid Loading Score**: LCP < 1.2s, 60 FPS snapping scroll interactions.
- **Type-Safety Assurance**: Zero TypeScript compilation or linter errors during `tsc --noEmit`.
- **Usability standard**: Zero focus traps, passing AA WCAG contrast ratios across all three main themes.

## Out of Scope

- High-frequency instant-messaging chatrooms.
- Direct monetization or billing integrations.

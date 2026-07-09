# Design Brief: Odyssey Clean Sanctuary Homepage

## Problem Statement

In today's fragmented digital era, social networks are bloated with ads, algorithmic manipulation, and performative boasting. It is nearly impossible to find a quiet space to slow down, read deeply, or share genuine aspects of life.

**Odyssey** is a clean, authentic personal sanctuary. It unifies the founder's life slices—thoughtful essays, raw moments (吐槽碎碎念), investment tracking (Stock Ledger), and curated music playlists—into a peaceful, highly polished, and cohesive homepage. It provides an oasis of true "Sharing" without social stress, ads, or distraction.

## Users & Ability Spectrum

- **The Founder (You)**: Needs a pristine, premium platform to share and document thoughts, investments, and music without visual clutter or maintenance fatigue.
- **Kindred Travelers**: Visitors seeking to read, listen, and explore the founder's world in a calm, distraction-free environment.
- **Jordan (Low-vision / Zoom User)**: High-contrast semantic tokens, clear focus visible states, and perfect responsive scaling at 200% zoom using native HeroUI.
- **Marcus (Motor Impairment / Keyboard User)**: 100% keyboard-navigable page layout. Clean Tab index with explicit focus rings and non-obstructive page navigation.
- **Priya (Cognitive / Non-native Reader)**: Highly structured taxonomy, generous whitespace, clear content hierarchy, and straightforward language.

## Design Direction & Clean Animation

- **Theme & Component Alignment**: 100% built using `@heroui/react` and `@heroui-pro/react` components. Zero raw HTML or custom styling hacks. Rely completely on native semantic props (`variant`, `color`, `size`) and standard theme tokens to ensure flawless integration across Glass, Brutalism, and Mouve themes.
- **The Clean Animation Strategy (The Gentle Fade-and-Lift)**: To keep the experience non-flashy and premium, we use a single, highly refined GSAP scroll-driven animation: **a gentle fade-and-lift transition (opacity + subtle Y-axis offset + soft blur-in)**. As the user scrolls, each core module (Welcome, Moments, Essays, Stock Ledger, Playlists) slowly and smoothly glides into view like a quiet exhibition piece. It feels light, organic, and peaceful, with a complete fallback for users preferring reduced motion.
- **Bento Structure**: A beautifully proportioned, structured layout on the homepage that groups these personal interests cleanly, allowing visitors to expand or read sections in-place without jarring page reloads.

## Constraints

- **100% HeroUI Compliance**: No hardcoded custom border-radiuses, shadows, borders, or colors. Use native HeroUI properties and CSS custom properties only.
- **A11y Standards**: Strict compliance with WCAG AA standards. High contrast, clear visible focus outlines, and screen reader labels.

## Success Criteria

- **Visual Polish**: Fluid, smooth transitions, running at 60 FPS, with zero layout shifts.
- **Type-Safety Assurance**: Zero compilation errors via `bun x tsc --noEmit`.
- **Sanctuary Feeling**: A calm, inviting aesthetic that encourages visitors to linger and read.

## Out of Scope

- Flashy, multi-layered 3D scroll-parallax that causes GPU thrashing or motion sickness.
- Real-time chatting rooms or tracking analytics.

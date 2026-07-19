# Design State: Odyssey Dashboard & Blog

_Last updated: 2026-07-05 by design-strategist_

## Brief

- **Problem:** Realign Odyssey as a premium personal sanctuary that counters the fragmented, ad-bloated, and performative nature of modern social networks. Create a clean, elegant, and non-flashy homepage utilizing 100% HeroUI components and a serene, high-performance "Gentle Fade-and-Lift" GSAP animation to showcase thoughts, moments, stock ledger, and curated song sharing.
- **Primary persona:** Jordan (low-vision / keyboard user), Priya (non-native speaker), Marcus (motor impairment).
- **Success metric:** 100% HeroUI-compliant components, smooth "Gentle Fade-and-Lift" GSAP scrolling (60 FPS), and zero TypeScript compile errors.
- **Brief document:** `docs/designpowers/briefs/2026-07-05-odyssey-homepage-clean-sanctuary.md`

## Personas

- **Jordan** — Low-vision, uses 200% zoom and high contrast. Relies heavily on clear focus rings and native contrast tokens.
- **Priya** — Non-native speaker, values clear content taxonomy and straightforward layout hierarchy in navigation and charts.
- **Marcus** — Motor impairment, uses keyboard-only navigation. Requires logical Tab order, focus visible states, and large target areas.

## Design Principles

1. **Absolute Styling Integrity** — Never bypass the theme by injecting hardcoded background, border, shadow, or border-radius classes. Use semantic HeroUI props.
2. **Predictable Navigation & High Accessibility** — Ensure clear focus states, robust keyboard routing, and explicit descriptive screen reader labels for all actions.
3. **Fluid and Performant Motion** — Ensure motion sequences are choreographed cleanly and offer instant reduced-motion fallbacks for safe viewing.
4. **Resonant Communication** — Avoid cold corporate language; use welcoming, emotional, and interactive cues to establish genuine dialogue.

## Taste Profile

- **Emotional target:** Premium, fluid, native, cinematic
- **Quality level:** Flagship / Production
- **Key references:** HeroUI Pro DocsSite, Compact designs, Linear/Obsidian UI polish
- **Aesthetic principles:** Responsive bento grid, liquid island navigation, cinematic scrolling parallax, high-contrast dynamic hover pills, Canvas physical particle micro-interactions.

## Decisions Log

| Date       | Agent             | Decision                                | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-03 | design-scout      | Initiate Review Lane (Navbar)           | Request to review and enhance `@components/navbar.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-07-03 | design-builder    | Native Floating Navbar                  | Convert custom `sticky` styling to native `position="floating"` to inherit and respect active global themes (Glass, Brutalism, Mouve).                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-07-03 | design-builder    | Programmatic Bento routing              | Replace nested `<Link>` elements inside `<Dropdown.Item>` with `onAction` programmatic navigation to resolve "double-focus" keyboard and screen-reader issues.                                                                                                                                                                                                                                                                                                                                                     |
| 2026-07-03 | design-builder    | Trigger Accessibility                   | Add explicit `aria-label="User account menu"` to user profile `<Dropdown.Trigger>` to resolve unlabeled screen-reader access.                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-07-03 | design-builder    | Reduce Motion Safeguards                | Conditionally reduce stagger and slide-up animations inside the mobile menu dropdown if the user prefers reduced motion.                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-07-03 | design-builder    | Remove Style Overrides & Radius Props   | Remove arbitrary style overriding classNames on native buttons and replace invalid `radius` props with standard HeroUI Tailwind class-mapping `rounded-full` in `className`, conforming 100% to HeroUI v3 specs.                                                                                                                                                                                                                                                                                                   |
| 2026-07-03 | design-builder    | 100% Component Specification Compliance | Fully clean up all style leakages. Replace raw HTML `<kbd>` shortcuts with native HeroUI `<Kbd>` components. Remove all custom padding, border, hover, and typography classes from `<Dropdown.Item>` and `<Label>` components, allowing HeroUI's design tokens and BEM classes to style them natively.                                                                                                                                                                                                             |
| 2026-07-03 | design-scout      | Initiate Review Lane (Stock Ledger)     | Request to review and enhance `@components/blog/stock-ledger.tsx` to fix visual accessibility, HeroUI v3 compliant layout, and semantic styling issues.                                                                                                                                                                                                                                                                                                                                                            |
| 2026-07-03 | design-builder    | Remove Hover/Active Click Animations    | Removed hover:-translate-y-0.5 and active:scale-[0.98] animations from Recently Bought carousel items and Active Strategic Positions grid cards because they are static informational elements with no onClick or route handlers, resolving confusing pseudo-click indications.                                                                                                                                                                                                                                    |
| 2026-07-03 | design-builder    | Dynamic "Exit" Taxonomy for SELL        | Replaced static "Cost" header label with a conditional {stock.action === "SELL" ? "Exit" : "Cost"} render inside the positions list, ensuring bookkeeping taxonomy accuracy for realized sales.                                                                                                                                                                                                                                                                                                                    |
| 2026-07-04 | design-builder    | Implement Data Table for Positions      | Replaced the nested grid of cards for 'Active Strategic Positions' with a sleek HeroUI Pro `Widget` and `Table` to improve data scannability, align numeric fields using tabular-nums, and remove redundant surface nesting.                                                                                                                                                                                                                                                                                       |
| 2026-07-04 | design-scout      | Complete Project Discovery              | Aligned with user on Odyssey Cyber Sanctuary vision, multi-scene parallax scrolling, particle emotional reactions, and 6-phase project schedule.                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-07-05 | design-strategist | Appreciate Core Philosophy & Realign    | Aligned on a clean, elegant, non-flashy digital sanctuary. Decided on 100% HeroUI components and the "Gentle Fade-and-Lift" GSAP scroll animation strategy.                                                                                                                                                                                                                                                                                                                                                        |
| 2026-07-05 | user              | Remove Stacked Cards (ChronicleDeck)    | Removed the stacked folding cards from the homepage because the creative director deemed it a bad design, favoring clean and straightforward content transitions.                                                                                                                                                                                                                                                                                                                                                  |
| 2026-07-05 | user              | 100% English Translation & Copy Polish  | Translated all homepage comments, labels, and Jukebox narratives to English. Removed redundant Bento headers, and polished the portfolio ledger headers to sound reflective and premium.                                                                                                                                                                                                                                                                                                                           |
| 2026-07-05 | user              | Separate Stock Ledger & Jukebox Panels  | Restructured the homepage to split Stock Ledger and Jukebox into separate, full-width sections on scroll instead of side-by-side, giving each its own focus and breathing room.                                                                                                                                                                                                                                                                                                                                    |
| 2026-07-05 | user              | Unify Animations with 100% motion/react | Completely purged GSAP (gsap, ScrollTrigger, useGSAP) from the homepage, StockLedger, and OrbitalCarousel. Unified all transitions under 'motion/react' (Framer Motion). This removes redundant dependencies, eliminates scroll-limit/stuck playhead issues, and provides an exceptionally clean, 100% React-native architecture.                                                                                                                                                                                  |
| 2026-07-05 | user              | Wrap HeroUI Components in motion()      | Adopted official HeroUI Animation/Composition guidelines by wrapping native 'Chip', 'Typography', and 'Button' with motion() to achieve seamless, type-safe Framer Motion staggered entrance and premium micro-interactions on the Hero. Replaced all raw HTML '<section>' tags globally with native HeroUI '<Surface>' and '<MotionSurface>' layouts.                                                                                                                                                             |
| 2026-07-05 | user              | Two-Way motion/react Scroll Transitions | Fully configured 'once: false' and responsive 'amount' viewport thresholds on all homepage sections. This natively implements full entry (appearance) and exit (disappearance) transitions on scroll, keeping all modules breathing dynamically and fluidly under 100% motion/react.                                                                                                                                                                                                                               |
| 2026-07-19 | user              | Refine Background to Pristine Stars     | Completely restructured IntroPanel. Split hero title into high-contrast dual lines with "Drift & Anchor" motion. Replaced clutter with a spaced Cinematic Sub-title and a Gravitational Scroll Tide Indicator. To balance absolute cleanness with a visible premium designed atmosphere, replaced dynamic WebGL with a stunning, static dual-orb overlapping aurora glow (Deep Indigo & Soft Violet, 10-12% visible opacity) overlaid with a spotlight-fading 1.2px Coordinate Dot Matrix. Compiled with 0 errors. |

## Open Questions

- None.

## Artefact Index

| Artefact           | Path                                   | Status              |
| ------------------ | -------------------------------------- | ------------------- |
| Navbar Component   | `components/navbar.tsx`                | Complete & Verified |
| Stock Ledger       | `components/blog/stock-ledger.tsx`     | Complete & Verified |
| Parallax Homepage  | `app/page.tsx`                         | Complete & Verified |
| Moments Carousel   | `components/blog/orbital-carousel.tsx` | Planned             |
| Blog Archive       | `app/blog/page.tsx`                    | Planned             |
| Reader Detail View | `app/blog/[slug]/page.tsx`             | Planned             |
| Guestbook Screen   | `app/guestbook/page.tsx`               | Planned             |
| Tiptap Workstation | `app/admin/posts/[id]/edit/page.tsx`   | Planned             |

## Design Debt Register

_Items: 0 | Critical: 0 | Oldest: —_

| ID  | Date | Source | Severity | What | Who is affected | Suggested fix | Status | Notes |
| --- | ---- | ------ | -------- | ---- | --------------- | ------------- | ------ | ----- |

## Handoff Chain

### 2026-07-03 design-scout ➔ design-critic, accessibility-reviewer, heuristic-evaluator

> "I have extracted the target component `@components/blog/stock-ledger.tsx` and formulated the inferred brief. We have a premium portfolio ledger. It incorporates charting, KPIs, and card layouts. Let's run a parallel audit for styling, HeroUI v3 API, UX heuristics, and visual accessibility."

### 2026-07-03 design-builder ➔ design-critic, accessibility-reviewer, heuristic-evaluator

> "I have successfully executed the two major fixes directed by the creative director: purging the pseudo-click scale/hover animations from the static stock cards to eliminate interactive anti-patterns, and implementing dynamic column taxonomy ('Exit' vs 'Cost') for SELL transactions. The TypeScript compiler verified our modifications with 0 errors. Let's run a final quality verification."

### 2026-07-04 design-scout ➔ design-strategist, design-lead, design-builder

> "Project Discovery is complete. We have formulated the design brief for the Odyssey Cyber Sanctuary. The user approved the 6-phase development roadmap. We are ready to transition to Phase 1: Cinematic Main Scroll Frame & Core Layout."

### 2026-07-05 design-strategist ➔ design-lead, design-builder

> "The Creative Director has approved our Clean Sanctuary Homepage design brief. The design must be 100% compliant with HeroUI, absolutely pristine, with a clean and calm 'Gentle Fade-and-Lift' (opacity + Y-axis slide + soft blur-in) animation. I am passing this on to design-lead to construct the visual layout and content integration."

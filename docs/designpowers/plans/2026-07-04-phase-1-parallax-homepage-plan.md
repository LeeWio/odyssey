# Design Plan: Phase 1 — Cinematic Parallax Homepage

> **For agentic workers:** REQUIRED: Use designpowers:designpowers-critique to review completed work against this plan.

**Goal:** Transform the homepage (`app/page.tsx`) into a high-end cinematic experience that utilizes GSAP ScrollTrigger to snap-scroll through 5 distinctive, immersive scenes representing the different dimensions of the Odyssey Cyber Sanctuary, complete with seamless accessibility and theme adaptability.

**Design Direction:** [Odyssey Cyber Sanctuary Brief](docs/designpowers/briefs/2026-07-04-odyssey-cyber-sanctuary.md) and [Odyssey Strategy](docs/designpowers/strategy/2026-07-04-odyssey-strategy.md)

**Personas:** Jordan (low-vision), Priya (cognitive), Marcus (motor impairment)

---

## Task 1: Immersive Parallax Snapping Scaffold

**Files:** `app/page.tsx`

- [ ] **Step 1:** Clean up the existing corporate/marketing mock content on `app/page.tsx` (Ship Faster, ACME, Powerful Features, Think Different) and replace it with a structured 5-scene container framework (`<section id="scene-welcome" ...>`, etc.).
- [ ] **Step 2:** Initialize GSAP ScrollTrigger in a robust `useGSAP` hook on the page. Use scroll snapping so each section snaps perfectly to the top of the viewport.
- [ ] **Step 3:** Bind each scene to a custom timeline that handles smooth parallax translations for its children (e.g., text moving slower than cards, background star-drift effects).
- [ ] **Step 4:** Ensure timeline instances are properly registered with ScrollTrigger and automatically clean up on unmount.

**Accessibility check:**

- Ensure sections use semantic `<section>` HTML elements with unique `id` and descriptive `aria-label`s.
- Marcus (keyboard traveler) must be able to scroll-snap cleanly between sections when focus shifts via keyboard `Tab` key. Prevent layout traps by triggering programmatical scroll snaps on focus changes.

**Verification:**

- Perform standard scroll tests with mousewheel and touch gestures. Verify section snap precision and check that no console warnings are logged.

---

## Task 2: Scene 1 — Cinematic Welcome Screen

**Files:** `app/page.tsx`, `components/hero/galaxy.tsx`, `components/hero/blur-text.tsx`

- [ ] **Step 1:** Integrate the existing 3D particle Canvas `Galaxy` background underneath the welcome screen, styled with native HeroUI colors.
- [ ] **Step 2:** Use the `BlurText` component to make the welcoming copy (e.g., _"旅人，欢迎来到我的数字避难所。"_ / _"Traveler, welcome to my digital sanctuary."_) reveal itself with a smooth organic blur fade-in.
- [ ] **Step 3:** Design a prominent "explore downward" prompt at the bottom of the section, with a slow-pulsing arrow button using native HeroUI `Button` and `icon` components.

**Accessibility check:**

- Welcoming text must meet WCAG AA contrast ratio against the dark Galaxy background (at least 4.5:1).
- The pulsing arrow must have a clear `aria-label="Scroll to next section"` and an explicit focus outline.

**Verification:**

- Check contrasting ratios across Brutalism, Glass, and Mouve themes using standard accessibility tools.

---

## Task 4: Scene 2 — Moments Carousel Placeholder Section

**Files:** `app/page.tsx`, `components/blog/orbital-carousel.tsx`

- [ ] **Step 1:** Render a dedicated parallax scene displaying the Orbital Carousel of your Moments (short posts/images).
- [ ] **Step 2:** Connect the ScrollTrigger timeline so that as this section snaps into focus, the carousel cards expand from a dense orbital core with an elegant slide-and-reveal choreography.
- [ ] **Step 3:** Add placeholder buttons for emotional reactions (`🎧`, `📈`, `☕`, `🪵`) using standard HeroUI components.

**Accessibility check:**

- Carousel cards must have `aria-roledescription="slide"` and clear focus outline indicators on active items.

**Verification:**

- Ensure cards behave correctly on hover/focus and do not overflow horizontal shadow buffers.

---

## Task 5: Scene 3 — Stock Ledger & Custom Jukebox Section

**Files:** `app/page.tsx`, `components/blog/stock-ledger.tsx`

- [ ] **Step 1:** Pull in the existing `StockLedger` data widget, positioning it as a floating 3D glass monument alongside a placeholder Slot for the upcoming `Jukebox` (Music Player) card.
- [ ] **Step 2:** Synchronize ScrollTrigger parallax so the Stock Ledger Table and KPIs lift up from the ground on enter and sink away on leave.

**Accessibility check:**

- The Stock Ledger table must use semantic captions and proper row/col-header associations. Focus orders inside charts and tables must remain logical.

**Verification:**

- Run `bun x tsc --noEmit` and confirm that stock card layout remains 100% compliant with HeroUI.

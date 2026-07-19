# Design Plan: Horizontal Scroll Fluid Backdrop (Option A: Dynamic Aurora Blobs)

> **For agentic workers:** REQUIRED: Use designpowers:designpowers-critique to review completed work against this plan.

**Goal:** Create a fixed, dynamic backdrop with 3-4 glowing aurora blobs that morph color, size, and position fluidly based on the user's horizontal scroll position, transitioning seamlessly from deep indigo to emerald, warm amber, and teal.

**Design Direction:**
- **Minimalist Cosmic Glow**: A global, fixed backdrop layer (`fixed inset-0`) that stays pinned behind the sliding container.
- **Fluid Scrollytelling**: 3-4 large blurring blobs (`motion.div` with `blur-[130px]` to `blur-[160px]`) whose positions, scales, and background colors are driven by `scrollYProgress`.
- **Contrast & Hierarchy**: The page content (cards, typography, tickers) floats on top of this glowing mist. Text remains perfectly legible in both dark & light modes.
- **Reduced Motion Support**: For users with motion sensitivities, the blobs stay anchored in position and smoothly fade/transition colors statically or use gentle opacities.

**Personas Served:**
- **Marcus (Motor Impairment)**: Relies on smooth, predictable scroll performance. GPU-accelerated transforms keep performance solid.
- **Jordan (Low Vision)**: High-contrast text remains perfectly readable because background glow intensities are kept soft (`bg-indigo-500/[0.08]` dark, etc.) and text uses proper high-contrast HeroUI typography.
- **Sienna (Vestibular/Motion Sensitive)**: Respected by disabling spatial translations when `prefers-reduced-motion: reduce` is active.

---

## Task 1: Create the `FluidBackdrop` Component

**Files:** `components/background/fluid-backdrop.tsx`

- [ ] Step 1: Initialize `FluidBackdrop` component accepting `scrollYProgress` (MotionValue<number>) as a prop.
- [ ] Step 2: Set up `useReducedMotion` and `useSpring` to smooth out transition values.
- [ ] Step 3: Define 3-4 dynamic blobs using Framer Motion's `useTransform` mapped across 4 scroll keyframes:
  - **0.00 (Intro - Odyssey)**: Indigo/Violet (centering, deep glow).
  - **0.33 (Chronicle)**: Emerald/Slate (shifting left/right, forest green tint).
  - **0.66 (Orbit)**: Amber/Rose (warm heart rate energy, expanding).
  - **1.00 (Travelogue)**: Teal/Cyan (Iceland aurora, high-altitude horizon).
- [ ] Step 4: Map positions (`x`, `y`), scale (`scale`), opacities, and CSS color tokens seamlessly.
- [ ] Step 5: Implement light-mode versus dark-mode adaptive colors (e.g. using HeroUI or Tailwind system variables or tailwind's `dark:` classes, or using custom themes).

**Accessibility check:**
- Ensure background contrast meets WCAG AA standards. Ensure background glow doesn't conflict with high-contrast text.
- Verify `prefers-reduced-motion` completely disables coordinate-movement (translation) and leaves only slow, ambient color-change cross-fades.

**Verification:**
- File compiles without TypeScript or import errors.

---

## Task 2: Refactor `app/page.tsx` and Mount the Backdrop

**Files:** `app/page.tsx`

- [ ] Step 1: Import the new `FluidBackdrop` component.
- [ ] Step 2: Inject `<FluidBackdrop scrollYProgress={scrollYProgress} />` as a fixed element within the main `Surface` component.
- [ ] Step 3: Remove static indigo and violet aura divs in `IntroPanel` (since they are now dynamically handled globally).
- [ ] Step 4: Make `ChroniclePanel`, `OrbitPanel`, and `TraveloguePanel` containers fully transparent (`transparent` surface or transparent background) so the dynamic background shines through under the cards and layout elements.
- [ ] Step 5: Keep the coordinate dot matrix in `IntroPanel` to act as an elegant, static glass-like mesh overlay.

**Accessibility check:**
- Ensure readability of the horizontal panel texts (Chronicle titles, Orbit cards, etc.) over the moving gradients.
- Confirm the background does not overlap interactive elements.

**Verification:**
- Horizontal scrolling behaves normally.
- Performance is solid (GPU-rendered layer).

---

## Task 3: Complete Build and Type Check Verification

**Files:** workspace-wide

- [ ] Step 1: Run type checking using `bun x tsc --noEmit`.
- [ ] Step 2: Run linter and formatting if needed.
- [ ] Step 3: Confirm all files are saved and types are 100% compliant with HeroUI and React.

**Accessibility check:**
- Run a quick accessibility scan or cognitive walkthrough representation.

**Verification:**
- Build passes without any type, lint, or runtime errors.

# Design Plan: Scroll-Driven Fluid Background Architecture

> **For agentic workers:** REQUIRED: Use designpowers:designpowers-critique to review completed work against this plan.

**Goal:** Transform the homepage background (@app/page.tsx) into an S-Tier, clean, and fluid scroll-responsive canvas. The scroll progress will act as a physical playhead, dynamically morphing atmospheric aura glows, sliding coordinate dot-mesh parallax, and rolling numeric geographic odometers in perfect, hardware-accelerated sync.

**Design Direction:** Contemplative, high-fidelity, pristine digital sanctuary. Static and absolute clean on load, but fluidly breathing and morphing in response to scroll coordinates.

**Personas Served:**

- **Jordan** (low-vision): Zero fast/flashing animations. All scroll transitions are smooth, 100% linear to scroll progress, and completely static if the user does not scroll. Fully supports `reducedMotion` settings.
- **Priya** (non-native speaker): Visual hierarchy reinforced by quiet environmental color shifting, separating reading zones (Chronicle) from routine zones (Orbit).

---

## Task 1: Parallax Spotlight Dot Matrix (星阵视差偏移)

**Files:** `app/page.tsx`

- [ ] **1. Create independent background layer:** Render the spotlight dot matrix (`dotMatrixStyle`) inside a dedicated `motion.div`.
- [ ] **2. Map Scroll to Dot Parallax:** Use Framer Motion's `useTransform` to bind the X-axis translation of the dot matrix layer to `scrollYProgress`:
  ```typescript
  const dotX = useTransform(scrollYProgress, [0, 1], ["0px", "-160px"]);
  const dotSpringX = useSpring(dotX, { stiffness: 80, damping: 26 });
  ```
- [ ] **3. Apply Translate:** Style the layer with `style={{ transform: `translateX(${dotSpringX})` }}`.
- **Accessibility check:** If `reducedMotion` is true, default `dotSpringX` to `0px` to prevent any parallax shifts, keeping the backdrop static.

**Verification:** As the page scrolls horizontally, the coordinate dot matrix behind the text shifts slightly slower than the text, creating a smooth 3D parallax depth.

---

## Task 2: Scroll-Driven Fluid Aura Morphing (引力云团流式位移与变色)

**Files:** `app/page.tsx`

- [ ] **1. Bind Aura Positions to Scroll:** Use `useTransform` to drift the Deep Indigo and Soft Violet ambient orbs along X and Y coordinates as scroll progress increases:
  - Orb 1 (Indigo): `x` shifts by `120px` to the left, `y` shifts up by `80px`.
  - Orb 2 (Violet): `x` shifts by `180px` to the right, `y` shifts down by `100px`.
- [ ] **2. Bind Colors & Opacity to Sections:** Slowly morph the background glow of the orbs to reflect the emotional sanctuary phases:
  - _Intro (0% to 25%):_ Deep Indigo (`bg-indigo-500`) and Soft Violet (`bg-accent`).
  - _Chronicle (25% to 50%):_ Smoothly fade into Forest Teal (`bg-teal-500`) and soft emerald hues.
  - _Orbit (50% to 75%):_ Shift into a crisp Steel Slate grey (`bg-zinc-600`) representing cockpit routine.
  - _Travelogue (75% to 100%):_ Transition into Icelandic Aurora Cyan (`bg-cyan-500`) and deep polar blue.
- **Accessibility check:** Contrast of text over these soft background glows must remain above 4.5:1 at all times. Use low opacities (`opacity: [0.08, 0.12]`).

**Verification:** Environment colors morph softly and seamlessly on scroll, representing the transitions between different zones without page-load flashing.

---

## Task 3: Geographic Rolling Odometer & Viewfinder Crosshairs (测绘准星与数字坐标滚轮)

**Files:** `app/page.tsx`

- [ ] **1. Add 4 Viewfinder Crosshairs:** Add static 1px geometric crosshairs (`+`) at the corners of the viewport to establish map-coordinate borders.
- [ ] **2. Add Rolling Odometer UI:** Render an elegant, microscopic rolling numeric odometer at the bottom center (or inside the coordinates badge) that maps directly to the active panel's coordinates:
  - Intro (Shanghai): `31°14′N`
  - Chronicle (London): `51°30′N`
  - Orbit (Kyoto): `35°01′N`
  - Travelogue (Reykjavík): `64°08′N`
- [ ] **3. Implement Rolling Scroll Animation:** Use vertical Translate sliding so that as you scroll from panel 0 to 4, the odometer coordinate numbers roll smoothly up/down to lock the active coordinate in place.

**Verification:** Scroll-linked coordinates slide and lock gracefully, validating the geographic sanctuary metaphor in real-time.

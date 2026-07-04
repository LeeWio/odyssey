# Design & Implementation Plan: Blog Core System

This plan outlines the structured development of the core Blog System, which serves as the primary feature of the Odyssey platform. With the backend API models (`post-api.ts`, Zod validation, revision tracking) already in place, this plan focuses on establishing a premier, highly accessible, and visually stunning frontend reading and writing experience.

## Goal

Deliver a world-class, fully accessible, and unified blog ecosystem comprising a multi-category article feed, an immersive reader detail view with a liquid table of contents, a nested comments section, and an advanced content authoring workspace.

## Design Direction & Aesthetic Target

- **Emotional Target:** Premium, distraction-free, fluid, tactile.
- **Key Reference:** Medium-level reading focus blended with Linear/Stripe style dashboard layouts.
- **Color Palette:** High-contrast Achromatic Dark (dark theme) with Gold/Amber Accents, and elegant clean light theme support.
- **Accessibility Persona Focus:** Jordan (low-vision focus rings), Priya (straightforward taxonomies), Marcus (keyboard-only tab routing).

---

## Task 1: Unified Blog Archive Hub (Front-End Feed)

Create a dedicated landing page for browsing all blogs, series, and tags.

**Files:** `app/blog/page.tsx`, `components/blog/blog-feed.tsx`

- [ ] **Step 1:** Implement layout using a sidebar/offset pattern where categories (Explore, Passions, Builds, Curations) are mapped to a premium HeroUI horizontal segmented tab bar.
- [ ] **Step 2:** Add a unified search field with debounced query handlers, mapping to the backend Unified Search API, displaying results using HeroUI's `Kbd` shortcut indicator.
- [ ] **Step 3:** Render posts in a highly responsive Grid (cols 1 on mobile, 2 on tablet, 3 on desktop) of `ItemCard`s showing the Cover Image, Ticker/Category Avatar, reading time, and custom category badges.
- [ ] **Step 4:** Integrate horizontal scrolling for long tag arrays using `ScrollShadow` with horizontal orientation to prevent overflow issues on small devices.

**Accessibility check:**

- Ensure search field has explicit `aria-label="Search articles"`.
- Focus states for cards must have a visible high-contrast outline on keyboard tab navigation.
- Category tabs must be navigable via left/right arrow keys with proper ARIA role attributes.

**Verification:**

- Run `bun x tsc --noEmit` and check that `/blog` loads and filters categories with mock or live cache updates correctly.

---

## Task 2: Immersive Article Reader View (Reading Mode)

Establish a state-of-the-art reading experience designed for prolonged focus.

**Files:** `app/blog/[slug]/page.tsx`, `components/blog/reader-view.tsx`, `components/blog/table-of-contents.tsx`

- [ ] **Step 1:** Implement a distraction-free page layout featuring a top reading-progress bar that scales with the window's vertical scroll height.
- [ ] **Step 2:** Design a floating liquid left/right panel that generates a dynamic **Table of Contents (TOC)** parsed from article heading elements (`h2`, `h3`).
- [ ] **Step 3:** Use GSAP ScrollTrigger or intersection observers to highlight the active heading in the TOC as the reader scrolls through that section.
- [ ] **Step 4:** Style the main typography area with semantic prose variables (comfortable line heights `leading-relaxed`, high-contrast text foregrounds, proper margins around headers, and beautifully styled blockquotes with subtle gold accents).

**Accessibility check:**

- Reader mode should respect `prefers-reduced-motion` media queries on heading scroll highlights.
- Floating TOC links must be fully keyboard accessible (navigable via `Tab` with instant visual focus indicators).
- Table of Contents must use semantic `<nav>` wrappers and `aria-label="Table of contents"`.

**Verification:**

- Test page scroll with standard keyboard controls. Ensure the progress indicator is fluid and the active TOC highlight updates exactly in sync with viewport entry.

---

## Task 3: Interactive Comment Sandbox (Symbiosis Echo)

Develop a robust, nesting-capable, and engaging commenting board.

**Files:** `components/blog/comment-section.tsx`, `components/blog/comment-card.tsx`

- [ ] **Step 1:** Render comments in a tree layout (supporting nested reply threads up to 3 levels deep) using soft semantic background tokens for inner nesting.
- [ ] **Step 2:** Integrate reply triggers that expand a clean `TextArea` input inline without layout shifts or page refreshes.
- [ ] **Step 3:** Implement action triggers (such as "Like/Upvote" and "Reply") using icon-only buttons wrapped in informative `Tooltip`s.
- [ ] **Step 4:** Enforce frontend validation on submission forms (e.g. empty inputs, character limits) using standard HeroUI input error states.

**Accessibility check:**

- Text fields must have clear error announcements for screen readers.
- Every icon-only upvote button must have an `aria-label` like "Upvote comment" and a companion description `Tooltip`.
- Focus rings must accurately follow deep nested reply forms.

**Verification:**

- Submit and nesting interactions must be fully keyboard navigable with no trapped focus.

---

## Task 4: Content Creation Workspace (Tiptap Editor Page)

Develop a workspace for authors to draft and edit articles.

**Files:** `app/admin/posts/[id]/edit/page.tsx`, `components/rich-text/tiptap-editor.tsx`

- [ ] **Step 1:** Integrate the existing Tiptap editor engine with a sticky top Toolbar containing categorized text actions (Formatting, Headers, Lists, Links, Table).
- [ ] **Step 2:** Implement an inline image block loader that accepts image uploads or URLs, featuring rounded corners and custom description placeholders.
- [ ] **Step 3:** Add an absolute sidebar panel for metadata configuration (Category selector, tags list, slug editing, featured toggle, and status switch draft/publish).
- [ ] **Step 4:** Integrate automatic draft saves to localStorage and real-time validation via the backend revision API to prevent data loss.

**Accessibility check:**

- Every rich-text command button in the toolbar must have a descriptive `Tooltip` for screen readers and touch targets.
- Ensure the editor container has `role="textbox"` with appropriate multi-line accessibility.

**Verification:**

- Type text, upload mock images, toggle headings, and ensure content persists correctly after reloading.

---

## Task 5: Aviation Dashboard Metrics Widget (Analytics Cockpit)

Provide comprehensive post performance insights inside the Aviation Dashboard.

**Files:** `app/admin/dashboard/page.tsx`, `components/dashboard/post-metrics.tsx`

- [ ] **Step 1:** Create an analytics widget displaying total views, likes, word count trends, and read duration aggregates.
- [ ] **Step 2:** Integrate Sparklines or mini AreaCharts from `@heroui-pro/react` to plot article traffic over a 30-day timeline.
- [ ] **Step 3:** Formulate an "Editor's Pick & Popularity" table inside a premium `Widget` component to let authors promote articles directly to the homepage carousel.

**Accessibility check:**

- Chart values must have an accessible keyboard-navigable tabular data table fallback.
- Chart tooltips must present high-contrast colors.

**Verification:**

- Run build script (`bun run build`) to ensure the entire blog system compiles with 0 type errors.

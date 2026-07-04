# Design State: Odyssey Dashboard & Blog

_Last updated: 2026-07-03 by design-builder_

## Brief

- **Problem:** Review and enhance `@components/blog/stock-ledger.tsx` to align with HeroUI v3 standards, verify chart integrations, enforce styling integrity, and establish full accessibility compliance (screen reader and keyboard navigation).
- **Primary persona:** Jordan (low-vision / keyboard user), Priya (non-native speaker), Marcus (motor impairment).
- **Success metric:** 100% HeroUI-compliant stock ledger component, accessible legend for the PieChart, proper semantic element usage, correct keyboard interaction, and zero compile errors.
- **Brief document:** Reconstructed via inferred brief in the Review Lane.

## Personas

- Jordan — Low-vision, uses 200% zoom and high contrast. Relies heavily on clear focus rings and native contrast tokens.
- Priya — Non-native speaker, values clear content taxonomy and straightforward layout hierarchy in navigation and charts.
- Marcus — Motor impairment, uses keyboard-only navigation. Requires logical Tab order, focus visible states, and large target areas.

## Design Principles

1. **Absolute Styling Integrity** — Never bypass the theme by injecting hardcoded background, border, shadow, or border-radius classes. Use semantic HeroUI props.
2. **Predictable Navigation & High Accessibility** — Ensure clear focus states, robust keyboard routing, and explicit descriptive screen reader labels for all actions.
3. **Fluid and Performant Motion** — Ensure motion sequences are choreographed cleanly and offer instant reduced-motion fallbacks for safe viewing.

## Taste Profile

- **Emotional target:** Premium, fluid, native
- **Quality level:** Flagship / Production
- **Key references:** HeroUI Pro DocsSite & Compact designs
- **Aesthetic principles:** Responsive bento grid, liquid island navigation, high-contrast dynamic hover pills, dynamic active state indication.

## Decisions Log

| Date       | Agent          | Decision                                | Rationale                                                                                                                                                                                                                                                                                              |
| ---------- | -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-03 | design-scout   | Initiate Review Lane (Navbar)           | Request to review and enhance `@components/navbar.tsx`                                                                                                                                                                                                                                                 |
| 2026-07-03 | design-builder | Native Floating Navbar                  | Convert custom `sticky` styling to native `position="floating"` to inherit and respect active global themes (Glass, Brutalism, Mouve).                                                                                                                                                                 |
| 2026-07-03 | design-builder | Programmatic Bento routing              | Replace nested `<Link>` elements inside `<Dropdown.Item>` with `onAction` programmatic navigation to resolve "double-focus" keyboard and screen-reader issues.                                                                                                                                         |
| 2026-07-03 | design-builder | Trigger Accessibility                   | Add explicit `aria-label="User account menu"` to user profile `<Dropdown.Trigger>` to resolve unlabeled screen-reader access.                                                                                                                                                                          |
| 2026-07-03 | design-builder | Reduce Motion Safeguards                | Conditionally reduce stagger and slide-up animations inside the mobile menu dropdown if the user prefers reduced motion.                                                                                                                                                                               |
| 2026-07-03 | design-builder | Remove Style Overrides & Radius Props   | Remove arbitrary style overriding classNames on native buttons and replace invalid `radius` props with standard HeroUI Tailwind class-mapping `rounded-full` in `className`, conforming 100% to HeroUI v3 specs.                                                                                       |
| 2026-07-03 | design-builder | 100% Component Specification Compliance | Fully clean up all style leakages. Replace raw HTML `<kbd>` shortcuts with native HeroUI `<Kbd>` components. Remove all custom padding, border, hover, and typography classes from `<Dropdown.Item>` and `<Label>` components, allowing HeroUI's design tokens and BEM classes to style them natively. |
| 2026-07-03 | design-scout   | Initiate Review Lane (Stock Ledger)     | Request to review and enhance `@components/blog/stock-ledger.tsx` to fix visual accessibility, HeroUI v3 compliant layout, and semantic styling issues.                                                                                                                                                |
| 2026-07-03 | design-builder | Remove Hover/Active Click Animations    | Removed hover:-translate-y-0.5 and active:scale-[0.98] animations from Recently Bought carousel items and Active Strategic Positions grid cards because they are static informational elements with no onClick or route handlers, resolving confusing pseudo-click indications.                        |
| 2026-07-03 | design-builder | Dynamic "Exit" Taxonomy for SELL        | Replaced static "Cost" header label with a conditional {stock.action === "SELL" ? "Exit" : "Cost"} render inside the positions list, ensuring bookkeeping taxonomy accuracy for realized sales.                                                                                                        |
| 2026-07-04 | design-builder | Implement Data Table for Positions      | Replaced the nested grid of cards for 'Active Strategic Positions' with a sleek HeroUI Pro `Widget` and `Table` to improve data scannability, align numeric fields using tabular-nums, and remove redundant surface nesting.                                                                           |

## Open Questions

- None.

## Artefact Index

| Artefact         | Path                               | Status              |
| ---------------- | ---------------------------------- | ------------------- |
| Navbar Component | `components/navbar.tsx`            | Complete & Verified |
| Stock Ledger     | `components/blog/stock-ledger.tsx` | Complete & Verified |

## Design Debt Register

_Items: 0 | Critical: 0 | Oldest: —_

| ID  | Date | Source | Severity | What | Who is affected | Suggested fix | Status | Notes |
| --- | ---- | ------ | -------- | ---- | --------------- | ------------- | ------ | ----- |

## Handoff Chain

### 2026-07-03 design-scout ➔ design-critic, accessibility-reviewer, heuristic-evaluator

> "I have extracted the target component `@components/blog/stock-ledger.tsx` and formulated the inferred brief. We have a premium portfolio ledger. It incorporates charting, KPIs, and card layouts. Let's run a parallel audit for styling, HeroUI v3 API, UX heuristics, and visual accessibility."

### 2026-07-03 design-builder ➔ design-critic, accessibility-reviewer, heuristic-evaluator

> "I have successfully executed the two major fixes directed by the creative director: purging the pseudo-click scale/hover animations from the static stock cards to eliminate interactive anti-patterns, and implementing dynamic column taxonomy ('Exit' vs 'Cost') for SELL transactions. The TypeScript compiler verified our modifications with 0 errors. Let's run a final quality verification."

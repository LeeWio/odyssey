# Odyssey - UI & Design Specifications

This document defines the overarching design guidelines and integration strategies for building UIs in the Odyssey project. We enforce strict adherence to **HeroUI v3** principles, preferring its internal capabilities (styling, theming, composition) over ad-hoc custom classes or external methodologies.

## 1. Design Principles (HeroUI v3)

Based on HeroUI's core principles (`getting-started/design-principles`), all UI development should prioritize:

- **Semantic Intent Over Visual Style:** Use semantic terms for styling. When styling components like buttons, use variants (`variant="primary"`, `"secondary"`, `"tertiary"`, `"danger"`) instead of visual descriptors like "solid" or "bordered."
- **Accessibility as Foundation:** Components must rely on HeroUI's React Aria foundations. Ensure proper ARIA labeling, keyboard navigation, and structural layouts.
- **Composition Over Configuration:** Use compound components and dot-notation (e.g., `<Card.Header>`, `<Accordion.Panel>`) to construct complex UIs instead of relying on monolithic components with bloated prop APIs.
- **Progressive Disclosure:** Start simple with basic components. Layer in complexity (like loading states, icons, or custom render functions) only when required.
- **Separation of Styles and Logic:** Understand that HeroUI decouples its styling (available via BEM classes or `@heroui/styles`) from its React logic. Use BEM classes directly for non-interactive elements where appropriate.

## 2. Color System & Theming

Odyssey uses HeroUI's native color and theming system, powered by `oklch` and Tailwind CSS v4. **Hardcoded hex colors or arbitrary Tailwind palette colors are strictly forbidden.**

### How Colors Work
We rely completely on semantic CSS variables that seamlessly adapt to Light and Dark modes.

**Usage Rules:**
- Suffix-less variables are for backgrounds (e.g., `bg-accent`, `bg-background`).
- `-foreground` variables are for text appearing on top of their respective backgrounds (e.g., `text-accent-foreground`, `text-foreground`).

### Base & Background
- **Primitive Colors:** `--white`, `--black`, `--snow`, `--eclipse` (These do not change between themes).
- **Global:** `--background` (canvas) and `--foreground` (text/icons).
- **Surface:** `--surface` (cards, panels) and `--surface-foreground`.
- **Overlay:** `--overlay` (modals, popovers) and `--overlay-foreground`.

### Semantic Colors
Use these strictly for their designated communicative intent:
- **Accent:** `--accent` / `--accent-soft` (Primary brand color for primary actions).
- **Success:** `--success` (Validation, positive status).
- **Warning:** `--warning` (Cautions).
- **Danger:** `--danger` (Destructive actions, errors).
- **Default/Muted:** `--default`, `--muted` (Secondary elements, borders, placeholders).

### Theming Customization
Do not write inline styles. If you need to override colors, do it via CSS variables in the global CSS:
```css
:root {
  --accent: oklch(0.7 0.15 250);
}
```

## 3. Styling Patterns

Odyssey leverages HeroUI's robust styling methodologies.

### 🚨 CRITICAL: Do Not Override Component Defaults
**HeroUI components come with highly polished, accessible, and mathematically calculated default styles.** 
- **NEVER** attempt to manually override internal aesthetics via the `className` prop. 
- **DO NOT** add inline utility classes for padding (`p-4`), borders (`border`, `border-white`), border-radius (`rounded-xl`), or interactive states (`hover:bg-gray-100`) directly onto HeroUI components like `<Button>`, `<Card>`, or `<Chip>`.
- **ALLOWED USAGE:** The `className` prop on HeroUI components must be strictly reserved for **Layout and Positioning** purposes. It is acceptable to pass classes like `w-full`, `max-w-md`, `mt-4`, `flex-1`, or `col-span-2` to align the component within your page's grid or flexbox structure. All other aesthetic changes must be done via standard HeroUI props (e.g., `variant`, `color`, `size`).

### Utilizing BEM Classes
HeroUI exposes standard BEM classes for every component. For simple semantic styling without React overhead (e.g., inside native `<a>` tags or Next.js `<Link>`), use them directly:
```tsx
// Using BEM directly
<a className="button button--primary button--lg" href="/dashboard">Dashboard</a>
```

### Tailwind Variants (TV)
When building custom wrappers or extending components, use HeroUI's re-exported `tv` and variant functions from `@heroui/styles`.
```tsx
import { buttonVariants } from '@heroui/styles';
import Link from 'next/link';

<Link className={buttonVariants({ variant: "tertiary" })} href="/">Home</Link>
```

### State-Based Styling
Do not rely on complex JS state for CSS if HeroUI exposes data attributes. Use Tailwind's data attribute selectors or standard pseudo-classes:
- `[data-hovered="true"]`
- `[data-pressed="true"]`
- `[data-focus-visible="true"]`
- `[data-disabled="true"]`

## 4. Animation & Motion

Animations should utilize HeroUI's built-in CSS transitions or Framer Motion (`motion/react`) for complex orchestration.

### CSS Transitions
Leverage HeroUI's data-attributes for simple state transitions:
```css
.popover[data-entering] {
  @apply animate-in zoom-in-90 fade-in-0 duration-200;
}
```

### Framer Motion
For layout animations or entrance sequences, use Framer Motion, but adhere to HeroUI's accessibility standards.

**Accessibility Mandate (Reduced Motion):**
You must respect user preferences regarding motion. Use `useReducedMotion` or rely on Tailwind's `motion-reduce:` utility.
```tsx
import { useReducedMotion } from 'framer-motion';

function AnimatedCard() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}>
      ...
    </motion.div>
  );
}
```

## 5. Composition & Custom Elements

### Compound Components
Always prefer the compound component pattern (without the `.Root` suffix) for clarity and readability:
```tsx
<Accordion>
  <Accordion.Item>
    <Accordion.Trigger>Title</Accordion.Trigger>
    <Accordion.Panel>Content</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

### The `render` Prop (Custom Elements)
If you need a HeroUI component to render as a different DOM element (e.g., rendering a `<Button>` as a `<motion.button>` or an `<a>`), use the `render` prop. Do not wrap elements unnecessarily.

```tsx
<Button
  render={(domProps, {isPressed}) => (
    <motion.button {...domProps} animate={{scale: isPressed ? 0.9 : 1}} />
  )}
>
  Press me
</Button>
```
*Rule: Always ensure the rendered DOM element matches the semantic expectation (e.g., render a button as a `<button>`, not a `<div>`).*
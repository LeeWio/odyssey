# Technical design

- Requirement / Issue ID: PERF-CHRONICLE-TABS
- Decision: Replace static imports for non-active Chronicle panels with `next/dynamic` named-export loaders and a stable HeroUI Skeleton fallback.
- Why this design fits the current architecture: HeroUI Tabs already owns selection, accessibility, and inactive-panel mounting. Dynamic imports reduce the initial route chunk without duplicating tab state or introducing a second tab implementation.

## Current architecture

`features/chronicle/chronicle-page.tsx` statically imports four client feature trees. HeroUI `Tabs.Panel` unmounts inactive panels by default, but static imports still make those trees eligible for the initial client bundle.

## Proposed solution

Load each non-featured panel with `next/dynamic`; retain the existing `embedded` contract and render a layout-stable HeroUI Card/Skeleton fallback while the selected panel chunk is fetched.

## Alternatives and trade-offs

- Keep static imports: no loading boundary, but higher initial JavaScript cost.
- Use `ssr: false`: smaller browser work, but weakens server-rendered selected-tab output and is unnecessary for this client boundary.
- Use dynamic imports with default SSR behavior: preserves existing render semantics while deferring inactive panel chunks; selected design.

## Affected files and components

- `features/chronicle/chronicle-page.tsx`
- `docs/05-architecture/performance-optimization.md`

## Data or control flow

The initial route renders Featured using its server-provided digest data. Selecting another tab mounts its HeroUI panel, which invokes the corresponding dynamic loader; the feature's existing query and state lifecycle remains unchanged.

## Interface and compatibility impact

No public API or feature props change. The existing `embedded` prop remains the integration contract.

## Error handling and recovery

The existing feature-level loading and error states remain authoritative after the chunk resolves. The dynamic boundary supplies only a short-lived loading state during module fetch.

## Security and privacy

No change.

## Performance and observability

Reduces the initial Chronicle client chunk and defers query-capable feature code until user intent selects a tab. Verify with the Next.js analyze output and route behavior.

## Test strategy

Run formatting, lint, typecheck, production build, and focused browser/manual checks for initial Featured entry and each tab transition.

## Rollback and migration

Rollback is a single-file import reversal; no data migration is required.

## Simplified design justification

Use this only for a genuinely low-risk change and explain why a full design is unnecessary.

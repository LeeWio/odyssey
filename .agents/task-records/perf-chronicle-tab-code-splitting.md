# Requirement record

- Requirement / Issue ID: PERF-CHRONICLE-TABS
- Local record path (when no tracker exists): `.agents/task-records/perf-chronicle-tab-code-splitting.md`
- Title: Split non-active Chronicle tabs into demand-loaded client chunks
- Background: Chronicle is a public content route with a Featured panel as its default entry point.
- Problem statement: Four additional client feature trees are statically imported by the Chronicle client entry even though HeroUI Tabs only mounts the selected panel.
- Objective: Reduce initial Chronicle JavaScript and defer non-critical feature code until the visitor selects its tab.
- Scope: Chronicle tab component imports, loading fallback, and performance documentation.
- Out of scope: Tab information architecture, API contracts, visual redesign, and server-side data behavior.
- Constraints and dependencies: Next.js dynamic imports, HeroUI v3 Tabs, existing Tailwind and HeroUI conventions.
- Risks: A selected non-featured tab displays a short loading fallback while its chunk is fetched.
- Open questions: None; the repository source confirms inactive HeroUI panels are unmounted by default.

## Acceptance criteria

- [x] Default Featured entry no longer statically imports the four non-critical tab feature trees.
- [x] Selecting Explore, Orbit, Columns, or Archive still loads and renders the existing feature through the same HeroUI Tab panel.

## Domain mappings

Record exact names and mappings from the requirement. Load the matching domain reference when one exists, then verify each mapping against current source, tests, or logs before implementation.

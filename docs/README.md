# Docs

Odyssey is a personal product, not just a blog. This documentation space is organized so that a new contributor can understand:

- why the project exists
- what is currently built
- what comes next
- what the product may become
- why the system is designed this way
- how to contribute safely

## Top-Level Rules

- Read the relevant Next.js and HeroUI v3 documentation before making implementation changes.
- Treat HeroUI as the baseline UI system for the whole project.
- Use `motion/react` with HeroUI components by default for component-level animation.
- Introduce non-HeroUI UI primitives or non-default animation systems only with documented justification.

## Start Here

1. [Project Rules](./00-project-rules.md)
1. [Vision](./01-introduction/vision.md)
1. [Project Background](./01-introduction/background.md)
1. [Roadmap](./02-planning/roadmap.md)
1. [Architecture Overview](./05-architecture/overview.md)
1. [Development Setup](./06-development/setup.md)
1. [Design System](./04-design/design-system.md)
1. [Animation Design Specification](./04-design/animation-design-specification.md)

## Current Shape

- Homepage: cinematic product landing experience with telemetry, motion, and lightweight navigation
- Blog: chronological publishing surface for long-form posts and updates
- Media modules: music and stock panels as part of the broader personal dashboard
- Editorial tooling: rich-text and post workflows for publishing content

## Future Shape

- The site may grow into a broader personal operating surface, not only a blog
- New modules may include research notes, bookmarks, reading lists, task capture, knowledge base, or portfolio views
- Product decisions should be made with reuse, scalability, and long-term maintainability in mind
- Every new module should answer whether it is core, supporting, or experimental

## Doc Map

- `01-introduction/`: mission, background, and principles
- `02-planning/`: roadmap, milestones, backlog, changelog, future strategy
- `03-product/`: features, flows, IA, interaction, content strategy
- `04-design/`: system, theme, typography, motion, accessibility, animation spec
- `04-design/`: system, theme, typography, motion, accessibility, animation spec
- `05-architecture/`: frontend, backend, data, API, deployment, folders
- `06-development/`: setup, style, conventions, workflow, release, testing
- `07-modules/`: module-by-module ownership notes
- `08-research/`: research notes, references, experiments
- `09-decisions/`: ADR records
- `assets/`: diagrams, mockups, and supporting imagery

## Working Rule

If a future reader cannot answer "why this exists" or "what to do next" from the docs, the docs are incomplete.

If a future contributor cannot tell whether a change should use HeroUI, Motion, CSS, or GSAP from the docs, the docs are incomplete.

# ADR-0005: HeroUI Baseline

## Status

Accepted

## Context

The project uses HeroUI as its primary component system across pages, navigation, content surfaces, and interactive modules. Without a top-level rule, future work could drift into ad-hoc HTML and one-off patterns that weaken consistency and accessibility.

## Decision

Treat HeroUI as the baseline UI system for the entire project.

## Consequences

- supported HeroUI components should be used whenever available
- custom HTML should only be used when HeroUI cannot express the requirement cleanly
- exceptions must be documented so they do not become accidental defaults
- future UI work should preserve HeroUI semantics, accessibility, and theming

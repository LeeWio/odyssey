# ADR-0003: Module Lifecycle

## Status

Accepted

## Context

The product will likely add modules over time. Without a lifecycle model, experimental ideas can become permanent without review.

## Decision

Every new module should have an explicit lifecycle state such as prototype, beta, or production.

## Consequences

- experimental work stays identifiable
- production behavior is easier to protect
- module promotion requires intentional review

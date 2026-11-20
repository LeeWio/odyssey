# ENG-20261120 — Library workspace and notification recovery UX

State: IMPLEMENTED_LOCALLY

## Objective

Make the two reader return paths feel like product surfaces rather than a
collection of independent API sections: notifications should remain readable
when no navigation target exists, and the personal library should lead with the
next reading action while keeping discovery, organization, and history easy to
find.

## Design

- Keep the notification data contract unchanged. A row press always runs the
  existing read mutation; navigation remains conditional on the resolved
  destination. Filtered empty states expose a local reset action.
- Replace the library's long eager stack with four URL-addressable HeroUI tab
  views: Reading, Discover, Organize, and History. Only the selected view mounts
  its sections, while each existing section retains its own API and state
  boundary.
- Keep all interactive controls on HeroUI primitives and use Tailwind only for
  layout, spacing, and responsive overflow.

## Acceptance

- A notification with no reader destination can be marked read from the center
  or popover without opening an invalid route.
- Notification category/unread empty states can clear their filters locally.
- `/library` opens directly into Continue reading and Read later, supports
  `?view=discover|organize|history`, and does not mount inactive section
  requests.
- Desktop and narrow layouts preserve keyboard tabs, visible section semantics,
  and the existing section-level loading/error/empty/action behavior.

## Boundary

This is a frontend information-architecture and interaction pass. It does not
change Nexus endpoints, persisted data, authentication behavior, or production
state. Validation remains a separate follow-up activity after the feature work.

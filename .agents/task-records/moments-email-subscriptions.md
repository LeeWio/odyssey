# ENG-20261122 · Public Moments email subscriptions

The change is ready for review. The Odyssey and Nexus worktrees started clean. The targets are the protected `main` branches of `LeeWio/odyssey` and `LeeWio/nexus`. Both repositories require their CI and an independent approval.

## Requirement

Visitors can subscribe to all new public Moments by entering and confirming an email address. The feed toolbar opens the form without adding to the feed's vertical layout. Topic and view selections do not affect the subscription. A reader can subscribe to both Moments and the weekly newsletter and opt out of each independently.

## Design

- Odyssey reuses the existing email form logic and adds a HeroUI dialog, explicit email-link actions, and a public `/moments/entry/{id}` route outside the date archive. Email body links carry tokens in fragments and mutate state through a deliberate action. The mailbox one-click endpoint requires a POST.
- Nexus puts Moments consent and delivery in additive tables so older application revisions and existing newsletter queries cannot see those rows. The migration marks currently public records as already published. Private records can qualify when first observed as public, because historical visibility is unavailable.
- Publication records the eligible audience and one delivery per Moment and subscriber in the business transaction. A scheduled worker reuses the email sender and notification retry policy, leases batches, and checks the current subscription generation and public visibility immediately before sending. The unique job prevents duplicate scheduling. SMTP can still have an ambiguous outcome if a worker dies after the server accepts a message.
- Deploy Nexus before Odyssey. Application rollback leaves the additive schema intact. A previous Nexus revision has no worker for the new queue, and its weekly newsletter remains isolated.

## Verification

- Nexus Maven verification passed with 463 tests reported, including nine profile-specific skips. Five focused MySQL tests passed after a disposable MySQL 8.4 upgrade from V201 to V202. The tested upgrade created zero delivery jobs for the existing entries.
- Odyssey preflight and production build passed. Chromium passed all four new subscription scenarios and all five weekly subscription form scenarios. The wider run had three existing Moments timing and navigation test failures. The newsletter status test suite still uses four assertions with title copy that differs from the baseline.
- An isolated browser, Nexus, and Mailpit exercised signup, confirmation, first-publication delivery, the permanent link, and opt-out. The local test inbox received only the expected publication email. The existing weekly subscription for the same address remained active.
- Odyssey's OpenAPI snapshot is generated from the Nexus runtime document for `1e7f28b1b5601964a15cd1e7a2d76f0f6dae20b3`. All 319 frontend references matched the contract.

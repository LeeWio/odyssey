# ENG-20261122 · Moments subscription follow-up

The three follow-up fixes share one Odyssey PR against `main`. The changes cover
toolbar layout, the destination of publication email links, and the subscription
dialog's success behavior.

- Keep the topic button, subscription button, and visible List/Grid control on
  a single row. Give the active topic and its clear action a separate line.
  Preserve the container breakpoint for List/Grid.
- Redirect the entry route used by email to the existing `/moments#moment-ID`
  timeline link after checking that the Moment is public. This covers previously
  sent email links. The timeline retains its paginated anchor lookup.
- Close the subscription dialog after success and restore focus to its trigger.
  Include the submitted address and confirmation instructions in the HeroUI
  Toast. Keep validation and failure feedback in the open dialog.

## Verification

- Chromium kept the visible controls on one row with a long topic active at
  320, 390, 820, 1024, and 1440px. At 820 and 1024px the same topic previously
  wrapped the List/Grid control.
- Subscription coverage passed for validation, failure, automatic dismissal,
  focus restoration, Toast feedback, and reopening while a request is pending.
  The email route located a card on page two and returned 404 for an
  unavailable entry.
- The local browser with Nexus and Mailpit confirmed that an actual
  publication email opens the anchored card, including the redirect from the
  entry URL.
- Odyssey preflight passed with 454 unit tests. The wider Chromium run passed
  17 scenarios and reproduced the documented Chinese homepage slogan
  assertion failure.

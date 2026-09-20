# Newsletter Module

Newsletter is a supporting reader subscription feature. Public UI lives in `features/newsletter`; API hooks come from the generated OpenAPI layer.

## Public flows

- `NewsletterSubscribeForm` requests a confirmation email. The backend owns consent, token expiry, and email delivery.
- `/newsletter/verify?token=…` confirms a subscription; `/newsletter/unsubscribe?token=…` opts out through the matching public endpoint.
- Status pages distinguish waiting, success, missing tokens, and failed requests. Titles and descriptions reflect the active state; waiting/success use live status messages and failures use alerts.
- Failed requests expose a retry action. The shared error transform does not retain HTTP status, so the page does not claim every failure means the link expired or promise an absent resubscription form.

## Subscription form

- HeroUI's controlled `TextField` owns the email value and validation. Invalid
  addresses are blocked before submitting.
- A synchronous lock allows one pending submission per mounted form, including
  repeated submit events before the pending button renders. It is released after
  success or failure; backend rate limits and deduplication remain server concerns.
- Readers can edit the email while waiting. A successful request clears the input
  only if it has not been edited since submission, even if edits return to the
  original value.
- Success and failure feedback names the submitted address, so a late response
  cannot imply that a newly entered address was submitted. Editing or starting a
  new request clears the previous feedback.
- Failure keeps the current draft and displays a persistent alert alongside the
  shared error toast. The same submit button can retry. Success requests email
  confirmation and does not imply that the subscription has been verified.

## Completion and navigation

- After the server reports success, replace the URL with `/newsletter/{action}?status={action}` to remove the token from the current history entry.
- The existing token-free completion marker preserves the success presentation on reload without replaying a potentially single-use token. It is a display marker, not proof of subscription status or an authorization mechanism.
- A supplied token always takes precedence over the display marker and must be processed by the server. Missing or whitespace-only tokens without a matching completion marker produce a missing-link state without an API call.
- Query components are keyed by action and token so opening another email link in the same page does not inherit the previous request's success state.

## Validation

`tests/e2e/newsletter-status.spec.ts` exercises confirmation and unsubscription through the real UI with mocked APIs: delayed responses, successful URL replacement/reload, missing tokens, retry after failure, conflicting token/status parameters, and switching tokens before a response arrives. Tests do not send email or change real subscriptions.

`tests/e2e/newsletter-subscribe.spec.ts` covers edits during a delayed subscription,
duplicate submit events, clearing an unchanged draft, failed requests and retries,
and email validation. All API calls are intercepted; no confirmation emails are sent.

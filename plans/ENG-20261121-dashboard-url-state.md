# ENG-20261121 Dashboard URL State

## Requirement

Make the dashboard workspace URL the single source of truth for its open state
and active view. Remove the duplicate Redux state and synchronization effects so
deep links, browser history, notifications, command actions, and account
navigation all use one navigation contract.

## Scope

- Replace dashboard Redux actions/selectors with a shared URL navigation hook.
- Remove dashboard state from shell persistence and hydration.
- Keep dashboard view validation at the dashboard boundary.
- Preserve existing HeroUI Sheet interaction and URL push/replace semantics.

## Acceptance criteria

- `?dashboard=/...` opens the matching dashboard view directly.
- Closing the Sheet removes only the dashboard query parameter.
- Dashboard navigation, notifications, account menu, and command palette update
  the same URL state.
- No Redux dashboard state or URL-to-Redux synchronization remains.

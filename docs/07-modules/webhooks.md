# Webhook management

The dashboard supports creating and editing subscriptions, changing their
enabled state, sending tests, and reading delivery history. An edit with an
empty signing secret keeps the configured secret. Nexus only returns
delivery metadata in the history. The editor never reads back the secret.

Sending a test returns a delivery ID after enqueueing. The history asks for
the newest page while the browser is waiting and reports a result only after
a row with the same delivery ID appears. Network and delivery failures are
separate states. Test with an isolated target and mocked transport during
development.

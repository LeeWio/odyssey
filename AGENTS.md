# Agent notes (Odyssey / web)

## Styling

- Follow `docs/04-design` for all UI work.
- Use Tailwind utility classes for styling, including responsive layout and container queries.
- Do not add or write styles in CSS files.

## Git workflow

- Make commits and pushes on the **production server** only:
  - host: `liwei@47.122.123.12`
  - path: `/srv/blog/apps/web`
- Do **not** commit or push from a local workstation copy.
- Sync local edits to the server (e.g. rsync), then `git add` / `git commit` / `git push` there.
- Never commit secrets (`.env`, API keys, credential screenshots).

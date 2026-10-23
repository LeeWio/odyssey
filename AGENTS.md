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
- Sync local edits to the server as targeted patches using `git apply --check` and `git apply`, then `git add` / `git commit` / `git push` there. Do not sync by copying files or directories (including rsync).
- Run heavyweight checks locally; keep server-side verification lightweight to avoid exhausting production resources.
- Never commit secrets (`.env`, API keys, credential screenshots).

# Agent notes (Odyssey / web)

## Styling

- Follow `docs/04-design` for all UI work.
- Use Tailwind utility classes for styling, including responsive layout and container queries.
- Do not add or write styles in CSS files.

## HeroUI

Before adding, changing, or auditing any `@heroui/react` or `@heroui-pro/react` component, query the connected `heroui-pro` MCP. Do not guess props, variants, slots, or default styles from memory or from another HeroUI version.

Use the MCP first, then the installed package only if the MCP cannot answer:

- `list_components` when the component name or package is uncertain.
- `get_component_docs` for anatomy, compound parts, props, and examples. This is required before editing a component's usage.
- `get_css` for default padding, radius, background, border, shadow, and state styles before removing or adding a visual `className`.
- `get_component_source_code` for OSS prop and slot behavior. Pro source is not exposed.
- `get_docs` for theming, styling, and setup guides.
- `get_theme_variables` for tokens and theme variants.

Layout classes (`flex`, `grid`, `gap`, width, height, position, overflow, responsive layout) may stay. Do not restyle a component's own chrome when an official prop or the default style already does that job. Leave `components/rich-text/` overrides alone unless the task says otherwise.

## Git workflow

- Make commits and pushes on the **production server** only:
  - host: `liwei@47.122.123.12`
  - path: `/srv/blog/apps/web`
- Do **not** commit or push from a local workstation copy.
- Sync local edits to the server as targeted patches using `git apply --check` and `git apply`, then `git add` / `git commit` / `git push` there. Do not sync by copying files or directories (including rsync).
- Run heavyweight checks locally; keep server-side verification lightweight to avoid exhausting production resources.
- Never commit secrets (`.env`, API keys, credential screenshots).

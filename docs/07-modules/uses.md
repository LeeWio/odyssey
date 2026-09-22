# Uses

## Role

Uses is the personal toolkit page: hardware, software, and daily apps that stay on the desk.

## Data

- Source of truth: `features/uses/uses-data.ts`
- Entries are curated in-repo (not API-backed)
- Each item has a short description, optional tags, optional official `link`, and optional `note`
- Helpers: `filterUsesCategories`, `matchesUsesItem`, `getUsesItemCount`, `toSafeExternalUrl`

## Surfaces

| Surface       | Path / component                 | Notes                                     |
| ------------- | -------------------------------- | ----------------------------------------- |
| Full toolkit  | `/uses` → `UsesPage`             | Search, category tags, linked cards       |
| Persona embed | `/persona` setup tab → `compact` | Same list and filters without page chrome |

## Interaction

- Search matches name, description, note, tags, and category
- Category `TagGroup` filters to one group at a time (`All` restores the full list)
- Items with a safe `http(s)` link use HeroUI `Link` in `Card.Footer` (`target="_blank"`, `rel="noopener noreferrer"`)
- Empty search/filter results use HeroUI Pro `EmptyState` on a secondary surface (no nested Card)

## UI baseline

- Page shell: `Surface variant="transparent"`
- Eyebrow: `Chip` (no custom uppercase mono label)
- Count: `Surface variant="secondary"` metric block
- Category icons: `Avatar` soft + `Avatar.Fallback`
- Motion: `useReducedMotionPreference` + shared `createPageReveal`

## Status

Production-facing content. Keep the list short and honest; prefer official product links over affiliate noise.

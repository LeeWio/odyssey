# Friend Links

## Role

Friend Links is the public blogroll plus a moderated suggestion form for reciprocal or curated places on the open web.

## Surfaces

| Surface   | Path / component             | Notes                                       |
| --------- | ---------------------------- | ------------------------------------------- |
| Full page | `/links` → `FriendLinksPage` | Blogroll Chip, metric Surface, suggest form |
| Compact   | optional `compact` prop      | Omits page header chrome                    |

## UI baseline

- Shell: `Surface variant="transparent"`
- Header: secondary `Chip` (`Blogroll`), H1, muted body, secondary Surface metric
- Separators between header, list, and suggest sections
- Empty / error / no-match: HeroUI Pro `EmptyState` on secondary surface (no nested Card)
- Suggest: `Chip` (`Link exchange`) + soft moderation Chip + secondary Card form
- Link cards remain whole-card anchors for now (follow-up: Card footer `Link` pattern)

## Status

Production-facing. Keep the list honest; suggestions stay reviewed before publish.

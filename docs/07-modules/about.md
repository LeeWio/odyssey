# About

## Role

About is the identity page: defaults, play, craft notes, and a short taste trail. It also embeds in `/persona` via `compact` mode.

## Surfaces

| Surface     | Path / component                   | Notes                                        |
| ----------- | ---------------------------------- | -------------------------------------------- |
| Full page   | `/about` → `AboutPage`             | Breadcrumbs, About Chip, full section labels |
| Persona tab | `/persona` about panel → `compact` | No breadcrumbs / page Chip; denser gaps      |

## UI baseline

- Shell: `Surface variant="transparent"`
- Section eyebrows: secondary `Chip` (Defaults, Play, Taste)
- Cards: secondary; taxonomy chips tertiary; identity markers soft
- Avatar: soft fallback initials
- Close CTAs: HeroUI `Link` + `Link.Icon` to Chronicle and Uses

## Status

Production-facing personal content. Keep the voice short; prefer Chips over uppercase mono labels.

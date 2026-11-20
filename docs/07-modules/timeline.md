# Timeline

Three chronological surfaces exist. Only one is a product timeline, and it is still curated copy.

## Surfaces

| Surface           | Path                 | Status                                                                                                                           |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Footprints        | `/footprints`        | Shipped. Visit places and years in `features/footprints/footprints-data.ts`. This is the travel atlas, not the product timeline. |
| About taste trail | `/about`, `/persona` | Shipped. Static events in `features/about/about-content.ts`, rendered by `AboutTimeline`.                                        |
| Roadmap           | `/roadmap`           | Curated milestones in `features/roadmap/roadmap-page.tsx`. Treat dates and metrics as editorial copy.                            |
| Product timeline  | none                 | Planned. A cross-linked history of articles, notes, and projects. Do not add a third route until its lifecycle is written down.  |

Reading history in `/library` is per-article progress. It is not a timeline module.

## Rule

A new timeline must say which of these it extends. Footprints stays the travel record. The product timeline stays unbuilt until it has an owner, a source of events, and a link back to the underlying article or project.

## Shareable state

- Chronicle sections use `/chronicle?section=explore` (or `orbit`, `columns`, and `archive`); the featured section uses the clean `/chronicle` URL.
- Footprints uses `/footprints?year=2025&place=huizhou` to preserve a year filter and selected memory for refresh, browser history, and sharing.
- Invalid section, year, or place values fall back to the first available view without making the page unusable.

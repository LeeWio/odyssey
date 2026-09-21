# Footprints

## Role

Footprints is the personal travel atlas: a China-focused map, timeline, and detail panel for places that stayed on the record.

## Data

- Source of truth: `features/footprints/footprints-data.ts`
- Entries are curated in-repo (not API-backed yet)
- Each place has coordinates (representative city for a province), optional memory text, tags, and a year
- Years may be placeholders until visit dates are filled in
- Chronology helpers: `getSortedFootprints`, `getFootprintYears`, `getFootprintArcs`, `getFootprintsMapView`

## Surfaces

| Surface      | Path / component                          | Notes                                           |
| ------------ | ----------------------------------------- | ----------------------------------------------- |
| Full atlas   | `/footprints` → `FootprintsPage`          | Map + detail card + year tabs + timeline        |
| Home preview | `components/home/footprints-showcase.tsx` | Compact `FootprintsMap` + link to `/footprints` |

## Map

- Shared map UI: `FootprintsMap` (HeroUI Pro Map + MapLibre)
- Basemap styles live in `features/footprints/map-styles.ts`
- Viewport centers on the footprint set via `getFootprintsMapView`

## Status

Production-facing content for listed China places. Memories and years remain editable product data, not demo airline routes.

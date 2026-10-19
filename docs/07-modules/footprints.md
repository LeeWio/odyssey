# Footprints

## Role

Footprints is the personal travel atlas: a China-focused map, timeline, and detail panel for places that stayed on the record.

## Data

- Source of truth: `features/footprints/footprints-data.ts`
- Entries are curated in-repo (not API-backed yet)
- Each place has coordinates (representative city for a province), optional memory text, tags, and a year
- Years may be placeholders until visit dates are filled in
- Chronology helpers: `getSortedFootprints`, `getFootprintYears`, `getFootprintsMapView`

## Surfaces

| Surface      | Path / component                        | Notes                                                                                                            |
| ------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Full atlas   | `/footprints` → `FootprintsPage`        | Map + detail card + year tabs + timeline                                                                         |
| Home preview | `features/home/footprints-showcase.tsx` | Chip header + compact map HUD; preview rows use `title` then place/year; single atlas Link in the section header |

## Map

- Shared map UI: `FootprintsMap` (HeroUI Pro Map + MapLibre)
- Coverage zones use the exact administrative boundaries in `public/data/footprints-boundaries.geojson`, registered through MapLibre's `fill` and `line` layers via HeroUI's `useMap` hook
- Boundary source records: DataV administrative boundary GeoJSON for Hubei, Shaanxi, Guangzhou, Shenzhen, Chongqing, Anhui, Huizhou, Henan, and Hunan
- Basemap styles live in `features/footprints/map-styles.ts`
- Viewport centers on the footprint set via `getFootprintsMapView`

## Detail and timeline

- Detail card leads with `title`, then place, then `memory`; year/visit meta uses a soft `Chip`
- Tags use tertiary chips; taxonomy stays visually quieter than the note itself
- Timeline rows show year + place meta, then title, then a clamped memory
- Selection is shared: coverage zone, map marker, detail card, and timeline `aria-pressed` / `status="current"` all use the same active id
- Closing the map popup dismisses only the popup; it does not clear the selected memory
- Map popup uses the same note hierarchy as the detail card: meta chip, title, place, memory

## Status

Production-facing content for listed China places. Memories and years remain editable product data, not demo airline routes.

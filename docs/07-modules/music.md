# Music Module

Music is part of the personal identity surface, but playback is owned by the shared media stack — not by orphaned dashboard prototypes.

## Current shape

- Real playback: `features/media` (`MediaProvider`, mini player, `MediaPlayButton`)
- Home “Lately” may show a **favorite** track as artwork and title only when no licensed stream is wired
- Cockpit still embeds `MusicMiniWidget` for decorative play-state UI; treat it as experimental chrome unless it is connected to `features/media`

## Removed / avoided

- Fake remote demo streams (for example SoundHelix placeholders) must not appear as if they were personal listening history
- Unused `MusicDashboard` / `MusicPlayer` prototypes were deleted during the Phase 2 honesty pass

## Responsibilities

- Prefer one media context for any audible playback
- Keep listening cards honest about streaming availability
- Stay visually light on the homepage and cockpit

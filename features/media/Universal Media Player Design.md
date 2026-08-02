# Universal Media Player System Design

## 1. Overview

Implement a universal media playback system for the personal website.

The system should not be designed as a simple music player.

The goal:

> Any UI component can trigger media playback through a unified API.

Examples:

- Music card plays a song
- Album card plays a collection of songs
- Playlist plays multiple tracks
- Future support for video, podcast, article narration

Architecture:

    UI Component
          |
          v
    Media API
          |
          v
    Media Player Engine
          |
          v
    HTML Audio Element

---

## 2. Design Principles

Components such as:

- ItemCard
- MusicCard
- AlbumCard

should only provide media information.

They should NOT:

- create Audio objects
- manage playback state
- handle queue
- handle next/previous

Good:

```tsx
<MediaPlayButton media={album} />
```

---

## 3. Data Model

### Track

A single playable unit.

```ts
export interface MediaTrack {
  id: string;
  title: string;
  artist?: string;
  src: string;
  duration?: number;
}
```

### MediaItem

The object passed from UI.

```ts
export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  cover?: string;

  type: "track" | "album" | "playlist";

  tracks: MediaTrack[];
}
```

---

## 4. Supported Media Types

### Single Track

One item contains one track.

Behavior:

    Click Play

    ↓

    Play this track

### Album

One item contains multiple tracks.

Behavior:

    Click Play

    ↓

    Track 1

    ↓

    Track 2

    ↓

    Track 3

### Playlist

Same mechanism as album.

---

## 5. Player State

```ts
interface PlayerState {
  currentMedia?: MediaItem;

  queue: MediaTrack[];

  currentIndex: number;

  playing: boolean;

  currentTime: number;

  duration: number;
}
```

---

## 6. Player API

```ts
interface MediaPlayer {
  play(media: MediaItem): void;

  pause(): void;

  resume(): void;

  toggle(): void;

  stop(): void;

  next(): void;

  previous(): void;

  seek(seconds: number): void;
}
```

---

## 7. React Provider

Recommended structure:

    features/media/

    ├── media-provider.tsx
    ├── media-context.ts
    ├── use-media-player.ts
    ├── media-player.ts
    └── types.ts

Usage:

```tsx
const { play } = useMediaPlayer();

play(album);
```

---

## 8. Audio Engine

Use native HTMLAudioElement.

Example:

```ts
const audio = new Audio();

audio.src = track.src;

audio.play();
```

Avoid unnecessary dependencies.

---

## 9. MediaPlayButton

Create a reusable component:

```tsx
<MediaPlayButton media={album} />
```

Responsibilities:

- show play state
- show pause state
- call Media API
- detect current playing item

---

## 10. ItemCard Integration

ItemCard only triggers playback.

Example:

```tsx
<ItemCard.Action>
  <MediaPlayButton media={album} />
</ItemCard.Action>
```

ItemCard should not contain audio logic.

---

## 11. Mini Player

Do not put full player inside ItemCard.

Create a global mini player.

Example:

    --------------------------------

    🎵 Song Name

    Artist

          ◀   ⏸   ▶

    --------------------------------

Responsibilities:

- current track display
- pause/resume
- next track

---

## 12. Animation

Match the website style.

Avoid:

- aggressive animations
- large controls

Recommended:

Album cover:

    scale:
    1 -> 1.03 -> 1

Mini player:

    opacity
    blur
    translateY

---

## 13. File Structure

    src/features/media/

    ├── components
    │   ├── media-play-button.tsx
    │   └── mini-player.tsx
    │
    ├── hooks
    │   └── use-media-player.ts
    │
    ├── core
    │   └── media-player.ts
    │
    ├── context
    │   └── media-provider.tsx
    │
    └── types.ts

---

## 14. Future Extension

The system should allow:

### Video

```ts
type: "video";
```

### Podcast

```ts
type: "podcast";
```

### Article narration

```ts
type: "article";
```

No changes should be required in ItemCard.

---

## 15. Final Goal

Developer experience:

```tsx
<MediaPlayButton media={anything} />
```

The system handles:

- playback
- queue
- current state
- pause/resume
- next track
- global player

UI only answers:

> What should be played?

Media System answers:

> How should it be played?

export interface MediaTrack {
  id: string;
  title: string;
  artist?: string;
  src: string;
  duration?: number;
}

export type MediaItemType = "track" | "album" | "playlist";

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  cover?: string;
  type: MediaItemType;
  tracks: MediaTrack[];
}

export interface PlayerState {
  currentMedia?: MediaItem;
  queue: MediaTrack[];
  currentIndex: number;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
}

export interface MediaPlayerAPI {
  play: (media: MediaItem) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  toggleShuffle: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
}

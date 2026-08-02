import { MediaItem, MediaTrack, PlayerState } from "../types";

export type StateChangeHandler = (state: PlayerState) => void;

export class MediaPlayer {
  private audio: HTMLAudioElement | null = null;
  private state: PlayerState;
  private onStateChange: StateChangeHandler;

  constructor(onStateChange: StateChangeHandler) {
    this.onStateChange = onStateChange;
    this.state = {
      queue: [],
      currentIndex: -1,
      playing: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      shuffle: false,
    };

    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.setupAudioListeners();
    }
  }

  private setupAudioListeners() {
    if (!this.audio) return;

    this.audio.addEventListener("timeupdate", () => {
      this.updateState({ currentTime: this.audio?.currentTime || 0 });
    });

    this.audio.addEventListener("durationchange", () => {
      this.updateState({ duration: this.audio?.duration || 0 });
    });

    this.audio.addEventListener("play", () => {
      this.updateState({ playing: true });
    });

    this.audio.addEventListener("pause", () => {
      this.updateState({ playing: false });
    });

    this.audio.addEventListener("ended", () => {
      this.next();
    });

    this.audio.addEventListener("error", (e) => {
      console.error("Media Player Error:", e);
      this.updateState({ playing: false });
    });
  }

  private updateState(partialState: Partial<PlayerState>) {
    this.state = { ...this.state, ...partialState };
    this.onStateChange(this.state);
  }

  play(media: MediaItem) {
    if (!this.audio) return;

    const tracks = media.tracks;
    if (tracks.length === 0) return;

    this.updateState({
      currentMedia: media,
      queue: tracks,
      currentIndex: 0,
    });

    this.loadTrack(tracks[0]);
  }

  private loadTrack(track: MediaTrack) {
    if (!this.audio) return;

    this.audio.src = track.src;
    this.audio.load();
    this.audio.play().catch((err) => {
      console.warn("Autoplay might be blocked:", err);
    });
  }

  pause() {
    this.audio?.pause();
  }

  resume() {
    this.audio?.play().catch((err) => {
      console.warn("Playback failed:", err);
    });
  }

  toggle() {
    if (this.state.playing) {
      this.pause();
    } else {
      this.resume();
    }
  }

  toggleShuffle() {
    this.updateState({ shuffle: !this.state.shuffle });
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.updateState({ playing: false, currentTime: 0 });
  }

  next() {
    if (this.state.queue.length === 0) return;

    let nextIndex = this.state.currentIndex + 1;

    if (this.state.shuffle && this.state.queue.length > 1) {
      // Pick a random index that isn't the current one
      do {
        nextIndex = Math.floor(Math.random() * this.state.queue.length);
      } while (nextIndex === this.state.currentIndex);
    }

    if (nextIndex < this.state.queue.length) {
      this.updateState({ currentIndex: nextIndex });
      this.loadTrack(this.state.queue[nextIndex]);
    } else {
      this.stop();
    }
  }

  previous() {
    if (this.state.currentIndex > 0) {
      const prevIndex = this.state.currentIndex - 1;
      this.updateState({ currentIndex: prevIndex });
      this.loadTrack(this.state.queue[prevIndex]);
    } else {
      this.seek(0);
    }
  }

  seek(seconds: number) {
    if (!this.audio) return;
    this.audio.currentTime = seconds;
    this.updateState({ currentTime: seconds });
  }

  setVolume(volume: number) {
    if (!this.audio) return;
    this.audio.volume = volume;
    this.updateState({ volume });
  }

  getState(): PlayerState {
    return this.state;
  }

  destroy() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.src = "";
    this.audio.removeEventListener("timeupdate", () => {});
    this.audio.removeEventListener("durationchange", () => {});
    this.audio.removeEventListener("play", () => {});
    this.audio.removeEventListener("pause", () => {});
    this.audio.removeEventListener("ended", () => {});
    this.audio.removeEventListener("error", () => {});
    this.audio = null;
  }
}

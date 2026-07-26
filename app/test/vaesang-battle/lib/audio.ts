"use client";

// High-Performance, Lightweight HTML5 Audio Player for Vae Song Battle
// Relies 100% on the single-instance native browser media element with no legacy fallback noise.

class VaeAudioSynth {
  private isPlayingId: string | null = null;
  private stopCallback: (() => void) | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private activeMetadataListener: (() => void) | null = null;

  private getAudioEl(): HTMLAudioElement {
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.audioEl.volume = 0.8;
      this.audioEl.loop = true;
    }
    return this.audioEl;
  }

  public play(
    songId: string,
    songTitle: string,
    audioUrl?: string,
    onStop?: () => void,
    startTime?: number
  ) {
    // If already playing this song, do nothing
    if (this.isPlayingId === songId) return;

    // If playing another song, stop it first
    this.stop();

    this.isPlayingId = songId;
    this.stopCallback = onStop || null;

    // If audioUrl is provided, try to play the real track
    if (audioUrl) {
      try {
        const audio = this.getAudioEl();

        audio.onended = () => {
          this.stop();
        };

        audio.onerror = () => {
          console.error(`[Vae Player] Failed to load real audio from ${audioUrl}. Staying quiet.`);
          this.stop(); // Stop and stay perfectly quiet on load error
        };

        // Reset and assign source
        audio.src = audioUrl;

        if (startTime && startTime > 0) {
          // Remove old listener if any to avoid stacking multiple seeks on same element!
          if (this.activeMetadataListener) {
            audio.removeEventListener("loadedmetadata", this.activeMetadataListener);
          }

          // Register new listener to seek natively once headers are resolved
          this.activeMetadataListener = () => {
            try {
              audio.currentTime = startTime;
            } catch (err) {
              console.warn(
                "[Vae Player] Failed to seek to startTime inside loadedmetadata event:",
                err
              );
            }
          };
          audio.addEventListener("loadedmetadata", this.activeMetadataListener, { once: true });
        }

        audio.play().catch((err) => {
          console.error(`[Vae Player] Failed to play real audio: ${err.message}. Staying quiet.`);
          this.stop(); // Stop and stay perfectly quiet on playback error
        });
      } catch (e) {
        console.error("[Vae Player] Failed to initialize HTMLAudioElement.", e);
        this.stop();
      }
    }
  }

  public stop() {
    this.isPlayingId = null;

    if (this.audioEl) {
      try {
        this.audioEl.pause();

        // Wipe metadata seek listeners before resetting source to avoid ghost events
        if (this.activeMetadataListener) {
          this.audioEl.removeEventListener("loadedmetadata", this.activeMetadataListener);
          this.activeMetadataListener = null;
        }

        // Bulletproof physical stream-abort: force browser to immediately kill pending network download buffer and free audio hardware cache!
        this.audioEl.src = "";
        this.audioEl.load();

        // Clear references to prevent memory leaks and ghost ended callbacks
        this.audioEl.onended = null;
        this.audioEl.onerror = null;
      } catch (e) {
        console.error("[Vae Player] Failed to pause audio element", e);
      }
    }

    const currentStopCallback = this.stopCallback;
    this.stopCallback = null;

    if (currentStopCallback) {
      try {
        currentStopCallback();
      } catch (e) {
        console.error("[Vae Player] Failed to execute stop callback", e);
      }
    }
  }

  public getPlayingId(): string | null {
    return this.isPlayingId;
  }

  // ─── Direct Seek & Progress Tracking Methods for Real HTML5 Audio ───
  public getDuration(): number {
    return this.audioEl ? this.audioEl.duration || 0 : 0;
  }

  public getCurrentTime(): number {
    return this.audioEl ? this.audioEl.currentTime || 0 : 0;
  }

  public seek(time: number) {
    if (this.audioEl) {
      try {
        const targetTime = Math.max(0, Math.min(time, this.audioEl.duration || 0));
        this.audioEl.currentTime = targetTime;
      } catch (e) {
        console.warn("[Vae Player] Failed to seek HTMLAudioElement currentTime:", e);
      }
    }
  }
}

export const synth = new VaeAudioSynth();

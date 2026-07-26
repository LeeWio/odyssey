"use client";

// Web Audio API Procedural Synthesizer for Vae Song Battle
// Creates a unique, beautiful lo-fi ambient pentatonic melody loop for each song.

class VaeAudioSynth {
  private ctx: AudioContext | null = null;
  private isPlayingId: string | null = null;
  private stopCallback: (() => void) | null = null;
  private nextNoteTimeout: ReturnType<typeof setTimeout> | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private biquadFilter: BiquadFilterNode | null = null;

  // A warm, beautiful G major pentatonic scale (frequencies in Hz)
  // G3, A3, B3, D4, E4, G4, A4, B4, D5, E5
  private scale = [196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25];

  private getHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  // Generate 2 seconds of organic, warm vinyl record crackle noise procedurally
  private createVinylNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of loopable noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      // Pink/Brown filter walk for smooth crackle hiss
      const pink = lastOut * 0.95 + white * 0.05;
      lastOut = pink;

      // Add randomized high-amplitude pops and scratch cracks
      let pop = 0;
      if (Math.random() < 0.00015) {
        pop = (Math.random() * 2 - 1) * 0.42; // Loud crack crackle
      }

      data[i] = pink * 0.05 + pop;
    }
    return buffer;
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
        const audio = new Audio(audioUrl);
        this.audioEl = audio;
        audio.loop = true; // Loop the real music
        audio.volume = 0.8;

        if (startTime && startTime > 0) {
          audio.addEventListener(
            "loadedmetadata",
            () => {
              try {
                audio.currentTime = startTime;
              } catch (err) {
                console.warn("Failed to seek to startTime inside loadedmetadata event", err);
              }
            },
            { once: true }
          );
        }

        audio.onended = () => {
          this.stop();
        };

        audio.onerror = () => {
          console.warn(
            `Failed to load real audio from ${audioUrl}, falling back to procedural synthesizer.`
          );
          this.audioEl = null;
          this.playSynth(songId, songTitle);
        };

        audio.play().catch((err) => {
          console.warn(
            `Failed to play real audio: ${err.message}, falling back to procedural synthesizer.`
          );
          this.audioEl = null;
          this.playSynth(songId, songTitle);
        });
      } catch (e) {
        console.warn(
          "Failed to initialize HTMLAudioElement, falling back to procedural synthesizer.",
          e
        );
        this.playSynth(songId, songTitle);
      }
    } else {
      this.playSynth(songId, songTitle);
    }
  }

  private playSynth(songId: string, songTitle: string) {
    try {
      // Initialize AudioContext on user interaction
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("Web Audio API not supported in this browser");
        return;
      }

      this.ctx = new AudioContextClass();

      // Master Gain for smooth fade-in/fade-out of the whole synthesizer
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 0.5); // 0.5s fade-in

      // Create a gorgeous feedback delay effect for spacious ambient lo-fi sound
      this.delayNode = this.ctx.createDelay(1.0);
      this.feedbackNode = this.ctx.createGain();

      this.delayNode.delayTime.value = 0.35; // 350ms delay
      this.feedbackNode.gain.value = 0.45; // 45% feedback

      // Connect delay loop
      this.delayNode.connect(this.feedbackNode);
      this.feedbackNode.connect(this.delayNode);

      // Create a warm resonant Low-Pass filter to muff notes
      this.biquadFilter = this.ctx.createBiquadFilter();
      this.biquadFilter.type = "lowpass";
      this.biquadFilter.frequency.setValueAtTime(1100, this.ctx.currentTime); // Warm vintage cut
      this.biquadFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      // Connect filter output to master destination and delay
      this.biquadFilter.connect(this.masterGain);
      this.biquadFilter.connect(this.delayNode);

      // Connect master output to speakers
      this.masterGain.connect(this.ctx.destination);
      this.delayNode.connect(this.masterGain);

      // Procedural Vinyl Static Hiss & Scratch Pops
      try {
        const noiseBuffer = this.createVinylNoiseBuffer(this.ctx);
        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = noiseBuffer;
        this.noiseNode.loop = true;

        // Connect noise directly to master output so scratch frequencies remain sharp
        this.noiseNode.connect(this.masterGain);
        this.noiseNode.start(this.ctx.currentTime);
      } catch (noiseErr) {
        console.warn("Failed to start procedural vinyl crackle source node.", noiseErr);
      }

      // Seed-based melody generation
      const seed = this.getHash(songTitle + songId);

      // Define a 4-note repeating melody sequence
      const melodyNotes: number[] = [];
      for (let i = 0; i < 4; i++) {
        const noteIndex = (seed + i * 3) % this.scale.length;
        melodyNotes.push(this.scale[noteIndex]);
      }

      let step = 0;
      const playNextStep = () => {
        if (!this.ctx || this.ctx.state === "closed" || this.isPlayingId !== songId) return;

        const time = this.ctx.currentTime;
        const freq = melodyNotes[step % melodyNotes.length];

        // 1. Synthesize a warm, nostalgic FM/Music Box note
        // Carrier Oscillator (triangle wave for smooth woodwind/flute-like body)
        const carrier = this.ctx.createOscillator();
        carrier.type = "triangle";
        carrier.frequency.value = freq;

        // Modulator Oscillator (sine wave for bright, transient metal bell attack)
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        modulator.type = "sine";
        modulator.frequency.value = freq * 1.5; // Harmonic ratio
        modGain.gain.setValueAtTime(200, time); // Modulation depth
        modGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15); // Fast modulation decay

        // Connect modulator to carrier frequency
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        // 2. Note ADSR Envelope
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0, time);
        noteGain.gain.linearRampToValueAtTime(0.25, time + 0.04); // Smooth, soft attack
        noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.8); // Long music-box decay

        // Connect carrier to note envelope gain, and feed into lowpass filter
        carrier.connect(noteGain);
        noteGain.connect(this.biquadFilter!);

        // Start and stop oscillators
        carrier.start(time);
        modulator.start(time);
        carrier.stop(time + 1.0);
        modulator.stop(time + 1.0);

        step++;

        // Schedule next note (soft lo-fi rhythmic speed: 500ms per note)
        const tempo = 450 + (seed % 100); // 450-550ms slightly varying tempo for character
        this.nextNoteTimeout = setTimeout(playNextStep, tempo);
      };

      // Start the melody loop
      playNextStep();
    } catch (e) {
      console.error("Failed to start synth audio loop", e);
    }
  }

  public stop() {
    if (this.nextNoteTimeout) {
      clearTimeout(this.nextNoteTimeout);
      this.nextNoteTimeout = null;
    }

    const currentStopCallback = this.stopCallback;
    this.stopCallback = null;
    this.isPlayingId = null;

    if (this.audioEl) {
      try {
        this.audioEl.pause();
        // Bulletproof physical stream-abort: force browser to immediately kill pending network download buffer and free audio hardware cache!
        this.audioEl.src = "";
        this.audioEl.load();
        this.audioEl = null;
      } catch (e) {
        console.error("Failed to pause audio element", e);
      }
    }

    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode = null;
      } catch {}
    }

    if (this.ctx && this.masterGain) {
      const audioCtx = this.ctx;
      const gain = this.masterGain;

      try {
        // Smooth fade-out over 0.2 seconds to prevent audio clicks
        const fadeTime = 0.2;
        gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeTime);

        setTimeout(
          () => {
            audioCtx.close().catch(() => {});
          },
          fadeTime * 1000 + 50
        );
      } catch {
        audioCtx.close().catch(() => {});
      }
    }

    this.ctx = null;
    this.masterGain = null;
    this.delayNode = null;
    this.feedbackNode = null;
    this.biquadFilter = null;

    if (currentStopCallback) {
      currentStopCallback();
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
        console.warn("Failed to seek HTMLAudioElement currentTime:", e);
      }
    }
  }
}

export const synth = new VaeAudioSynth();

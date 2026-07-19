"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Card, Button, Chip, Slider, Label, Typography, ListBox, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import { TextShimmer } from "@heroui-pro/react";
import { useMounted } from "@mantine/hooks";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  cover: string;
  category: "Ambient" | "Classical" | "Piano" | "Minimalist";
  lyrics: {
    time: number;
    text: string;
  }[];
}

const PLAYLIST: readonly Track[] = [
  {
    id: "eno",
    title: "An Ending (Ascent)",
    artist: "Brian Eno",
    album: "Apollo: Atmospheres",
    duration: 252, // 4:12
    cover:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80",
    category: "Ambient",
    lyrics: [
      { time: 0, text: "[ Weightless swell. The frequency begins to expand. ]" },
      { time: 12, text: "A room shaped slowly by acoustics." },
      { time: 24, text: "Ascending through the vertical noise." },
      { time: 38, text: "Fading into absolute, peaceful isolation." },
      { time: 55, text: "The loop continues. Daily orbit calibrated." },
      { time: 80, text: "[ Ethereal synthesis continues to drift ]" },
    ],
  },
  {
    id: "part",
    title: "Spiegel im Spiegel",
    artist: "Arvo Pärt",
    album: "Alina",
    duration: 390, // 6:30
    cover:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80",
    category: "Classical",
    lyrics: [
      { time: 0, text: "[ A simple, repeating piano triad enters. ]" },
      { time: 15, text: "Mirror in mirror. Quiet reflections." },
      { time: 30, text: "A single violin bow stretches across the glass." },
      { time: 48, text: "Each repetition is an act of patient wait." },
      { time: 70, text: "Fusing silence with minimal sound." },
    ],
  },
  {
    id: "satie",
    title: "Gymnopédie No.1",
    artist: "Erik Satie",
    album: "Piano Works",
    duration: 195, // 3:15
    cover:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=400&q=80",
    category: "Minimalist",
    lyrics: [
      { time: 0, text: "[ Melancholic, swaying piano chords begin. ]" },
      { time: 10, text: "Gymnastics of the mind. Slow, deliberate paces." },
      { time: 22, text: "Letting the hours slide by without resistance." },
      { time: 40, text: "A quiet study of minimalist grace." },
    ],
  },
  {
    id: "yiruma",
    title: "River Flows in You",
    artist: "Yiruma",
    album: "First Love",
    duration: 225, // 3:45
    cover:
      "https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=400&q=80",
    category: "Piano",
    lyrics: [
      { time: 0, text: "[ Gentle, cascading acoustic notes swirl. ]" },
      { time: 10, text: "A river of thoughts flowing deep within." },
      { time: 24, text: "Building systems of strength, line by line." },
      { time: 42, text: "The melody resolves. Calibrating focus." },
    ],
  },
] as const;

// Helper to format duration: 252 -> "04:12"
const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};

// Premium ease-out easing curve
const enterEase = [0.23, 1, 0.32, 1] as const;

export function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const mounted = useMounted();
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTrack = PLAYLIST[currentTrackIndex];

  // Sync lyrics text to current duration
  const getActiveLyric = () => {
    let active = currentTrack.lyrics[0].text;
    for (const lyric of currentTrack.lyrics) {
      if (currentTime >= lyric.time) {
        active = lyric.text;
      }
    }
    return active;
  };

  const startTimer = useCallback(() => {
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    playTimerRef.current = setInterval(() => {
      setCurrentTime((time) => {
        if (time >= currentTrack.duration) {
          // Track complete: loop or go to next
          handleNext();
          return 0;
        }
        return time + 1;
      });
    }, 1000);
  }, [currentTrack.duration]);

  const stopTimer = () => {
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [isPlaying, startTimer]);

  // Restart time when switching tracks
  useEffect(() => {
    setCurrentTime(0);
    if (isPlaying) {
      startTimer();
    }
  }, [currentTrackIndex, isPlaying, startTimer]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!mounted) return null;

  return (
    <Card className="border-default/20 bg-default/40 mx-auto w-full max-w-4xl rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl md:p-6 lg:p-8">
      <div className="grid gap-8 md:grid-cols-12 md:items-stretch">
        {/* Left Side: Playlist Select list (Column span 5) */}
        <div className="border-default/20 flex flex-col border-b pb-6 md:col-span-5 md:border-r md:border-b-0 md:pr-6 md:pb-0">
          <div className="mb-4 flex items-center gap-2 px-1">
            <Icon icon="solar:music-library-bold" className="text-accent size-5" />
            <span className="text-muted text-xs font-bold tracking-wider uppercase">
              Acoustic library
            </span>
          </div>
          <ListBox
            aria-label="Select soundtrack track"
            selectionMode="single"
            selectedKeys={new Set([currentTrack.id])}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              const idx = PLAYLIST.findIndex((track) => track.id === selectedKey);
              if (idx !== -1) {
                setCurrentTrackIndex(idx);
                setIsPlaying(true);
              }
            }}
            className="flex-1 gap-1"
          >
            <ListBox.Item id="eno" textValue="An Ending (Ascent)">
              <div className="flex items-center gap-3 py-1">
                <div className="relative size-10 overflow-hidden rounded-lg">
                  <Image
                    fill
                    unoptimized
                    alt="Brian Eno cover"
                    className="object-cover"
                    src={PLAYLIST[0].cover}
                    sizes="40px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-semibold">An Ending (Ascent)</span>
                  <span className="text-muted truncate text-[10px]">Brian Eno</span>
                </div>
                <Chip size="sm" variant="soft" color="success">
                  Ambient
                </Chip>
              </div>
            </ListBox.Item>

            <ListBox.Item id="part" textValue="Spiegel im Spiegel">
              <div className="flex items-center gap-3 py-1">
                <div className="relative size-10 overflow-hidden rounded-lg">
                  <Image
                    fill
                    unoptimized
                    alt="Arvo Pärt cover"
                    className="object-cover"
                    src={PLAYLIST[1].cover}
                    sizes="40px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-semibold">Spiegel im Spiegel</span>
                  <span className="text-muted truncate text-[10px]">Arvo Pärt</span>
                </div>
                <Chip size="sm" variant="soft" color="warning">
                  Classical
                </Chip>
              </div>
            </ListBox.Item>

            <ListBox.Item id="satie" textValue="Gymnopédie No.1">
              <div className="flex items-center gap-3 py-1">
                <div className="relative size-10 overflow-hidden rounded-lg">
                  <Image
                    fill
                    unoptimized
                    alt="Erik Satie cover"
                    className="object-cover"
                    src={PLAYLIST[2].cover}
                    sizes="40px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-semibold">Gymnopédie No.1</span>
                  <span className="text-muted truncate text-[10px]">Erik Satie</span>
                </div>
                <Chip size="sm" variant="soft" color="danger">
                  Minimalist
                </Chip>
              </div>
            </ListBox.Item>

            <ListBox.Item id="yiruma" textValue="River Flows in You">
              <div className="flex items-center gap-3 py-1">
                <div className="relative size-10 overflow-hidden rounded-lg">
                  <Image
                    fill
                    unoptimized
                    alt="Yiruma cover"
                    className="object-cover"
                    src={PLAYLIST[3].cover}
                    sizes="40px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-semibold">River Flows in You</span>
                  <span className="text-muted truncate text-[10px]">Yiruma</span>
                </div>
                <Chip size="sm" variant="soft" color="accent">
                  Piano
                </Chip>
              </div>
            </ListBox.Item>
          </ListBox>
        </div>

        {/* Right Side: High-Fidelity Turntable Console (Column span 7) */}
        <div className="flex flex-col justify-between md:col-span-7 md:pl-2">
          {/* Track Detail Header & Turntable Art */}
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
            {/* Spinning Vinyl Record Deck */}
            <div className="relative size-32 shrink-0 select-none">
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-full border-[4px] border-zinc-900 bg-zinc-950 shadow-lg shadow-black/40 dark:bg-black"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                style={{ animationPlayState: isPlaying ? "running" : "paused" }}
              >
                {/* Turntable groove lines */}
                <div className="absolute inset-2 rounded-full border border-dashed border-zinc-800 opacity-60" />
                <div className="absolute inset-4 rounded-full border border-zinc-800 opacity-40" />
                <div className="absolute inset-6 rounded-full border border-dashed border-zinc-800 opacity-60" />

                {/* Center album cover art as Vinyl center label */}
                <div className="relative size-12 overflow-hidden rounded-full border border-zinc-950">
                  <Image
                    fill
                    unoptimized
                    alt="Center label"
                    className="object-cover"
                    src={currentTrack.cover}
                    sizes="48px"
                  />
                </div>
                <div className="bg-background absolute size-2 rounded-full border border-zinc-950 shadow-inner" />
              </motion.div>

              {/* Virtual Stylus / Tone Arm (Moves onto vinyl when playing!) */}
              <motion.div
                className="pointer-events-none absolute -top-3 -right-2 size-12 origin-top-right"
                animate={{ rotate: isPlaying ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
              >
                <Icon
                  icon="solar:music-note-bold-duotone"
                  className="text-accent absolute top-1 right-2 size-5 animate-pulse"
                />
                <div className="absolute top-0 right-2 h-10 w-[3px] rounded-full bg-zinc-400 shadow-sm" />
                <div className="absolute top-9 right-1.5 h-3 w-1.5 rounded-sm bg-zinc-300 shadow-sm" />
              </motion.div>
            </div>

            {/* Title Metadata info */}
            <div className="flex min-w-0 flex-1 flex-col items-center pt-2 text-center sm:items-start sm:text-left">
              <Chip
                size="sm"
                variant="soft"
                color="accent"
                className="text-[9px] font-semibold tracking-wider uppercase"
              >
                {currentTrack.category}
              </Chip>
              <h2 className="text-foreground mt-2 max-w-full truncate text-xl leading-tight font-semibold">
                {currentTrack.title}
              </h2>
              <p className="text-muted mt-1 max-w-full truncate text-sm">{currentTrack.artist}</p>
              <p className="mt-0.5 max-w-full truncate font-mono text-[10px] text-zinc-500 italic">
                Album: {currentTrack.album}
              </p>
            </div>
          </div>

          {/* Real-time Scrolling Lyric Visualizer Card */}
          <div className="border-default/15 mt-6 rounded-2xl border bg-zinc-950/80 px-4 py-3.5 shadow-inner dark:bg-black/30">
            <div className="text-accent mb-2 flex items-center gap-2 text-[10px] font-bold tracking-wide uppercase">
              <Icon icon="solar:notes-bold-duotone" className="size-3.5 animate-bounce" />
              <span>Acoustic Sync Lyrics</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={getActiveLyric()}
                initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
                transition={{ duration: 0.18, ease: enterEase }}
                className="flex min-h-8 items-center justify-center text-center sm:justify-start sm:text-left"
              >
                {isPlaying ? (
                  <TextShimmer className="text-xs leading-relaxed font-semibold text-zinc-300 dark:text-zinc-200">
                    {getActiveLyric()}
                  </TextShimmer>
                ) : (
                  <span className="text-muted text-xs leading-relaxed font-medium">
                    [ Player paused. Press Play to sync. ]
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Timeline Seek Control (Using composable HeroUI Slider!) */}
          <div className="mt-6 flex flex-col gap-1">
            <Slider
              aria-label="Seek track position"
              value={currentTime}
              maxValue={currentTrack.duration}
              onChange={(val) => {
                setCurrentTime(val as number);
              }}
              className="w-full cursor-pointer"
            >
              <Slider.Track className="bg-default/20 h-1.5 overflow-hidden rounded-full">
                <Slider.Fill className="bg-accent" />
                <Slider.Thumb className="bg-accent border-background shadow-accent/20 size-3.5 border-2 shadow-md" />
              </Slider.Track>
            </Slider>
            <div className="text-muted mt-1 flex items-center justify-between px-0.5 font-mono text-[10px] font-semibold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>

          {/* Audio Console control dock (Transport & Volume) */}
          <div className="mt-5 flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
            {/* Playback Transport Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                isIconOnly
                variant="ghost"
                className="hover:bg-default/40 border-default/20 size-9 rounded-xl border"
                aria-label="Previous track"
                onPress={handlePrev}
              >
                <Icon icon="solar:skip-previous-bold" className="text-foreground size-5" />
              </Button>

              <Button
                isIconOnly
                className="bg-accent text-accent-foreground shadow-accent/15 size-11 rounded-full border-none shadow-md transition-transform duration-200 hover:scale-105"
                aria-label={isPlaying ? "Pause track" : "Play track"}
                onPress={handlePlayPause}
              >
                <Icon
                  icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"}
                  className="text-accent-foreground size-6"
                />
              </Button>

              <Button
                isIconOnly
                variant="ghost"
                className="hover:bg-default/40 border-default/20 size-9 rounded-xl border"
                aria-label="Next track"
                onPress={handleNext}
              >
                <Icon icon="solar:skip-next-bold" className="text-foreground size-5" />
              </Button>
            </div>

            {/* Volume seek control (Using HeroUI Slider) */}
            <div className="flex w-full items-center justify-center gap-3 sm:w-36">
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                className="hover:bg-default/40 border-default/20 size-8 shrink-0 rounded-lg border"
                aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                onPress={toggleMute}
              >
                <Icon
                  icon={
                    isMuted || volume === 0
                      ? "solar:volume-cross-bold"
                      : volume < 50
                        ? "solar:volume-low-bold"
                        : "solar:volume-loud-bold"
                  }
                  className="text-muted-fg size-5"
                />
              </Button>

              <Slider
                aria-label="Adjust volume"
                value={isMuted ? 0 : volume}
                onChange={(val) => {
                  setVolume(val as number);
                  if (isMuted) setIsMuted(false);
                }}
                maxValue={100}
                className="w-full max-w-xs cursor-pointer"
              >
                <Slider.Track className="bg-default/20 h-1 overflow-hidden rounded-full">
                  <Slider.Fill className="bg-muted-fg" />
                  <Slider.Thumb className="bg-muted-fg border-background size-2.5 border shadow-sm" />
                </Slider.Track>
              </Slider>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

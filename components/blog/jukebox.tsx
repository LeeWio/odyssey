"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Avatar,
  Chip,
  Typography,
  Tooltip,
  Surface,
  ScrollShadow,
  Slider,
} from "@heroui/react";
import { Widget, TextShimmer } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { MusicMiniWidget } from "./music-mini-widget";
import { RecentlyListened } from "../music/recently-listened";

interface Song {
  id: number;
  title: string;
  artist: string;
  cover: string;
  duration: number; // in seconds
  category: string;
  story: string; // The emotional sharing narrative
  color: "accent" | "warning" | "success" | "danger";
}

const SHARED_SONGS: Song[] = [
  {
    id: 1,
    title: "One Summer's Day",
    artist: "Joe Hisaishi",
    cover:
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&auto=format&fit=crop&q=60",
    duration: 180,
    category: "Late Night Focus",
    story:
      "Whenever I feel overwhelmed during late-night coding sessions, Joe Hisaishi's gentle piano keys bring instant tranquility. The soothing melody behaves like a cool summer breeze, brushing away the fragmented noise of the day to restore a deep sense of inner calm.",
    color: "accent",
  },
  {
    id: 2,
    title: "Bohemian Rhapsody",
    artist: "Queen",
    cover:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60",
    duration: 354,
    category: "Trading Mindset",
    story:
      "My absolute favorite track during periods of heavy market volatility. Life, much like this rhapsody, oscillates between operatic grandeur, sheer absurdity, and raw emotional valleys. After hearing it, the daily ticks fade away—'Nothing really matters to me' except staying genuine and true.",
    color: "warning",
  },
  {
    id: 3,
    title: "Landslide",
    artist: "Fleetwood Mac",
    cover:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=60",
    duration: 199,
    category: "Time & Solitude",
    story:
      "The steady accumulation of years and changing landscapes can feel as unstoppable as a landslide. Yet within this digital sanctuary, sharing these melodies is like releasing a message in a bottle into the river of time. I hope whoever retrieves it finds solace in these notes.",
    color: "accent",
  },
  {
    id: 4,
    title: "Let It Be",
    artist: "The Beatles",
    cover:
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=60",
    duration: 230,
    category: "Let It Be",
    story:
      "When life feels fragmented, confusing, and cluttered with modern boasting, The Beatles whisper 'Let it be'. Allow things to unfold naturally. Protect your mental sanctuary. This song is a gentle, timeless antidote to an impatient world.",
    color: "success",
  },
];

export function Jukebox() {
  const [activeSong, setActiveSong] = useState<Song>(SHARED_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [resonatedCount, setResonatedCount] = useState<number>(42);
  const [hasResonated, setHasResonated] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback progress simulation
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= activeSong.duration) {
            // Loop single song for premium ambient experience
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, activeSong]);

  // Reset progress when changing song
  const handleSelectSong = (song: Song) => {
    setActiveSong(song);
    setProgress(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const currentIndex = SHARED_SONGS.findIndex((s) => s.id === activeSong.id);
    const nextIndex = (currentIndex + 1) % SHARED_SONGS.length;
    handleSelectSong(SHARED_SONGS[nextIndex]);
  };

  const handlePrev = () => {
    const currentIndex = SHARED_SONGS.findIndex((s) => s.id === activeSong.id);
    const prevIndex = (currentIndex - 1 + SHARED_SONGS.length) % SHARED_SONGS.length;
    handleSelectSong(SHARED_SONGS[prevIndex]);
  };

  const handleResonate = () => {
    if (!hasResonated) {
      setResonatedCount((prev) => prev + 1);
      setHasResonated(true);
    } else {
      setResonatedCount((prev) => prev - 1);
      setHasResonated(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  return (
    <Surface
      variant="transparent"
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16 lg:px-12"
    >
      <MusicMiniWidget
        title="Realize"
        artist="Yanzi Sun"
        cover="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=60"
        onPlayChange={(playing) => console.log(playing)}
      />

      <RecentlyListened />
    </Surface>
  );
}

"use client";

import { Typography } from "@heroui/react";
import { ItemCard, ItemCardGroup } from "@heroui-pro/react";

type Song = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  isPlaying?: boolean;
};

const songs: Song[] = [
  {
    id: "realize",
    title: "Realize",
    artist: "Yanzi Sun",
    duration: "3:41",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "blinding-lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
    cover:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "midnight-city",
    title: "Midnight City",
    artist: "M83",
    duration: "4:03",
    cover:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "yellow",
    title: "Yellow",
    artist: "Coldplay",
    duration: "4:29",
    cover:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&auto=format&fit=crop&q=60",
    isPlaying: true,
  },
];

export function RecentlyListened() {
  return (
    <ItemCardGroup variant="transparent">
      <ItemCardGroup.Header className="items-center text-center">
        <MarkerTitle>Recently Listened</MarkerTitle>
      </ItemCardGroup.Header>

      {songs.map((song) => (
        <ItemCard key={song.id} className="hover:bg-content2/30 transition-all duration-300">
          <img
            src={song.cover}
            alt={`${song.title} - ${song.artist}`}
            className="ring-foreground/10 size-12 rounded-xl object-cover shadow-sm ring-1"
          />

          <ItemCard.Content>
            <ItemCard.Title>{song.title}</ItemCard.Title>
            <ItemCard.Description>{song.artist}</ItemCard.Description>
          </ItemCard.Content>

          <ItemCard.Action>
            <Typography color="muted" className="w-16 text-right text-base">
              {song.isPlaying ? "Playing" : song.duration}
            </Typography>
          </ItemCard.Action>
        </ItemCard>
      ))}
    </ItemCardGroup>
  );
}

function MarkerTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="pointer-events-none absolute bottom-[4px] left-1/2 z-0 h-5 w-[145%] -translate-x-1/2 overflow-visible"
        viewBox="0 0 360 20"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="recently-listened-marker" x1="0" y1="10" x2="360" y2="10">
            <stop offset="0%" stopColor="#F6C7D2" stopOpacity="0" />
            <stop offset="18%" stopColor="#F6C7D2" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#F6C7D2" stopOpacity="0.55" />
            <stop offset="82%" stopColor="#F6C7D2" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F6C7D2" stopOpacity="0" />
          </linearGradient>

          <filter id="recently-listened-marker-blur" x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        <path
          d="M18 10 C72 3.5 288 3.5 342 10"
          stroke="url(#recently-listened-marker)"
          strokeWidth="13"
          strokeLinecap="round"
          filter="url(#recently-listened-marker-blur)"
        />
      </svg>

      <ItemCardGroup.Title className="relative z-10 text-[28px] font-semibold tracking-[-0.04em]">
        {children}
      </ItemCardGroup.Title>
    </div>
  );
}

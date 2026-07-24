"use client";

import { Surface } from "@heroui/react";
import { RecentlyListened } from "../music/recently-listened";
import { MusicMiniWidget } from "./music-mini-widget";

export function Jukebox() {
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

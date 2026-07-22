"use client";

import React from "react";
import { Chip, Surface, Typography } from "@heroui/react";
import { MusicPlayer } from "@/components/music/music-player";
import { useMounted } from "@mantine/hooks";

export default function MusicPlaygroundPage() {
  return (
    <main className="bg-background relative min-h-[calc(100vh-4rem)] w-full overflow-hidden pt-8 pb-20">
      {/* Background blurring spot */}
      <div
        aria-hidden="true"
        className="bg-accent/5 dark:bg-accent/10 pointer-events-none absolute top-1/4 left-1/2 h-[35rem] w-[35rem] -translate-x-1/2 rounded-full blur-[120px]"
      />

      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-8 px-4">
        {/* Header branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Chip
            size="sm"
            variant="soft"
            color="accent"
            className="font-semibold tracking-wider uppercase"
          >
            Sound Sanctuary
          </Chip>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            A room shaped by acoustics.
          </h1>
          <p className="text-muted max-w-md text-sm">
            Slow soundtracks, ambient environments, and quiet frequencies kept to calibrate focus
            and change the weather of a day.
          </p>
        </div>

        {/* Music Player Console */}
        <div className="w-full">
          <MusicPlayer />
        </div>
      </div>
    </main>
  );
}

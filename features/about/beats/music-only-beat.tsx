"use client";

import { Icon } from "@iconify/react";
import { Surface, Typography, cn } from "@heroui/react";
import { aboutCaptions } from "../about-content";

interface BeatProps {
  compact?: boolean;
}

export function MusicOnlyBeat({ compact = false }: BeatProps) {
  return (
    <Surface
      variant="secondary"
      className={cn(
        "border-separator/50 overflow-hidden rounded-3xl border p-6 sm:p-8",
        compact ? "min-h-[200px]" : "min-h-[260px]"
      )}
    >
      <Typography type="body-sm" weight="semibold" className="text-muted mb-6 tracking-wide">
        {aboutCaptions.music}
      </Typography>

      <div
        className={cn(
          "relative mx-auto flex max-w-lg flex-col items-center justify-end gap-4",
          compact ? "h-28" : "h-36"
        )}
      >
        <div className="text-muted flex gap-2 text-xs opacity-40">
          <span className="bg-foreground/10 rounded-full px-3 py-1 line-through">Other A</span>
          <span className="bg-foreground/10 rounded-full px-3 py-1 line-through">Other B</span>
          <span className="bg-foreground/10 rounded-full px-3 py-1 line-through">Other C</span>
        </div>

        <Icon icon="simple-icons:applemusic" className="text-accent size-7" aria-hidden />
        <svg viewBox="0 0 240 36" className="text-accent h-8 w-56" aria-hidden="true">
          <path
            d="M0 18 C20 4, 40 32, 60 18 S100 4, 120 18 160 32, 180 18 220 4, 240 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </Surface>
  );
}

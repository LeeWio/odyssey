"use client";

import { Chip, Surface, Typography, cn } from "@heroui/react";
import { aboutCaptions, playTitles } from "../about-content";

interface BeatProps {
  compact?: boolean;
}

export function PlayHubBeat({ compact = false }: BeatProps) {
  return (
    <Surface
      variant="secondary"
      className={cn(
        "border-separator/50 overflow-hidden rounded-3xl border p-6 sm:p-8",
        compact ? "min-h-[200px]" : "min-h-[260px]"
      )}
    >
      <Typography type="body-sm" weight="semibold" className="text-muted mb-6 tracking-wide">
        {aboutCaptions.play}
      </Typography>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {playTitles.map((game, index) => (
          <Chip
            key={game.id}
            size="lg"
            variant="soft"
            color={index % 2 === 0 ? "accent" : "default"}
          >
            {game.label}
          </Chip>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Surface variant="default" className="rounded-2xl px-4 py-2">
          <Typography type="body-xs" weight="semibold" className="tracking-wide">
            PS5
          </Typography>
        </Surface>
        <Surface variant="default" className="rounded-2xl px-4 py-2">
          <Typography type="body-xs" weight="semibold" className="tracking-wide">
            Switch
          </Typography>
        </Surface>
        <Surface variant="default" className="rounded-2xl px-4 py-2">
          <Typography type="body-xs" weight="semibold" className="tracking-wide">
            Mobile
          </Typography>
        </Surface>
      </div>
    </Surface>
  );
}

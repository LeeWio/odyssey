"use client";

import { Surface, Typography, cn } from "@heroui/react";
import { aboutCaptions } from "../about-content";

interface BeatProps {
  compact?: boolean;
}

export function CokeAsideBeat({ compact = false }: BeatProps) {
  return (
    <Surface
      variant="secondary"
      className={cn(
        "border-separator/50 overflow-hidden rounded-3xl border p-6 sm:p-8",
        compact ? "min-h-[180px]" : "min-h-[220px]"
      )}
    >
      <Typography type="body-sm" weight="semibold" className="text-muted mb-6 tracking-wide">
        {aboutCaptions.coke}
      </Typography>

      <div className="relative mx-auto flex h-28 max-w-sm items-center justify-center gap-10">
        <div
          className="relative flex h-24 w-12 flex-col items-center"
          style={{ transform: "rotate(-4deg)" }}
        >
          <div className="bg-accent h-full w-full rounded-full shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_18%,transparent)]" />
          <div className="bg-background absolute top-3 h-3 w-8 rounded-sm opacity-90" />
        </div>

        <div className="bg-foreground/15 size-14 translate-x-6 rotate-12 rounded-full opacity-30">
          <div className="bg-background/80 m-3 size-8 rounded-full" />
        </div>
      </div>
    </Surface>
  );
}

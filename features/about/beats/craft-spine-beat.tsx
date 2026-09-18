"use client";

import { Surface, Typography, cn } from "@heroui/react";
import { aboutCaptions } from "../about-content";

interface BeatProps {
  compact?: boolean;
}

export function CraftSpineBeat({ compact = false }: BeatProps) {
  return (
    <Surface
      variant="secondary"
      className={cn(
        "border-separator/50 overflow-hidden rounded-3xl border p-6 sm:p-8",
        compact ? "min-h-[160px]" : "min-h-[200px]"
      )}
    >
      <Typography type="body-sm" weight="semibold" className="text-muted mb-8 tracking-wide">
        {aboutCaptions.craft}
      </Typography>

      <div className="relative mx-auto max-w-lg px-4 pb-4">
        <div className="text-muted mb-4 flex flex-wrap justify-center gap-2 text-xs opacity-35 line-through">
          {["Glow", "Badge", "Toggle", "Extra", "Skin", "Widget"].map((label) => (
            <span key={label} className="bg-foreground/10 rounded-full px-2.5 py-1">
              {label}
            </span>
          ))}
        </div>
        <div className="bg-accent mx-auto h-1.5 w-full max-w-md rounded-full" />
      </div>
    </Surface>
  );
}

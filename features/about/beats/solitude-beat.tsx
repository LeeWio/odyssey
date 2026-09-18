"use client";

import { Surface, Typography, cn } from "@heroui/react";
import { aboutCaptions } from "../about-content";

interface BeatProps {
  compact?: boolean;
}

const bubbles = [
  { id: "a", text: "got a sec?", left: "8%", top: "18%" },
  { id: "b", text: "quick sync?", left: "58%", top: "12%" },
  { id: "c", text: "thoughts??", left: "28%", top: "42%" },
  { id: "d", text: "ping", left: "62%", top: "48%" },
];

/** Quiet room: faded chat noise + closed door panel. Always visible. */
export function SolitudeBeat({ compact = false }: BeatProps) {
  return (
    <Surface
      variant="secondary"
      className={cn(
        "border-separator/50 relative overflow-hidden rounded-3xl border p-6 sm:p-8",
        compact ? "min-h-[220px]" : "min-h-[280px]"
      )}
    >
      <Typography
        type="body-sm"
        weight="semibold"
        className="text-muted relative z-20 mb-6 tracking-wide"
      >
        {aboutCaptions.solitude}
      </Typography>

      <div className={cn("relative", compact ? "h-36" : "h-44 sm:h-52")}>
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="bg-foreground/8 text-muted absolute rounded-2xl px-3 py-2 text-xs opacity-30 blur-[1px] sm:text-sm"
            style={{ left: bubble.left, top: bubble.top }}
          >
            {bubble.text}
          </div>
        ))}

        <div className="border-separator bg-surface absolute inset-y-2 right-0 w-[42%] rounded-l-3xl border border-r-0" />
        <div className="bg-accent/70 absolute top-1/2 right-[38%] z-10 size-2 -translate-y-1/2 rounded-full" />
      </div>
    </Surface>
  );
}

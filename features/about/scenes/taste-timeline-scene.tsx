"use client";

import { Surface, Typography, cn } from "@heroui/react";
import { aboutAria, aboutCaptions, tasteBeads } from "../about-content";
import { ChapterShell } from "./chapter-shell";

interface SceneProps {
  compact?: boolean;
}

export function TasteTimelineScene({ compact = false }: SceneProps) {
  return (
    <ChapterShell
      id="about-timeline"
      caption={aboutCaptions.timeline}
      ariaLabel={aboutAria.timeline}
      compact={compact}
    >
      <Surface variant="transparent" className="relative">
        <div
          className={cn(
            "flex gap-3 overflow-x-auto pb-2",
            compact ? "snap-x snap-mandatory" : "sm:grid sm:grid-cols-6 sm:gap-4 sm:overflow-visible"
          )}
        >
          {tasteBeads.map((bead) => (
            <div key={bead.id} className={cn("min-w-[7.5rem] flex-1 snap-center sm:min-w-0")}>
              <Surface
                variant="secondary"
                className="border-separator/50 flex h-full flex-col items-center gap-4 rounded-3xl border px-4 py-6"
              >
                <div
                  className={cn("size-3 rounded-full", bead.id === "now" ? "bg-accent" : "bg-foreground/35")}
                />
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className={cn("tracking-wide", bead.id === "now" ? "text-accent" : "text-foreground")}
                >
                  {bead.label}
                </Typography>
              </Surface>
            </div>
          ))}
        </div>
      </Surface>
    </ChapterShell>
  );
}

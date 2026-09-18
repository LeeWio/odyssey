"use client";

import { Surface, Typography, cn } from "@heroui/react";
import { aboutAria, aboutCaptions } from "../about-content";

interface SceneProps {
  compact?: boolean;
}

export function OutroScene({ compact = false }: SceneProps) {
  return (
    <section
      id="about-outro"
      aria-label={aboutAria.outro}
      className={cn(
        "relative w-full",
        compact ? "py-12" : "flex min-h-[50dvh] flex-col items-center justify-center py-24"
      )}
    >
      <Surface
        variant="transparent"
        className={cn(
          "mx-auto flex w-full max-w-4xl flex-col items-center text-center",
          compact ? "px-0" : "px-5"
        )}
      >
        <Typography
          type="h2"
          weight="bold"
          className={cn(
            "tracking-[-0.05em]",
            compact ? "text-[clamp(1.75rem,4vw,2.5rem)]" : "text-[clamp(2.5rem,7vw,4.75rem)]"
          )}
        >
          {aboutCaptions.outro}
        </Typography>
        <div className="bg-accent/70 mt-8 h-px w-16" />
      </Surface>
    </section>
  );
}

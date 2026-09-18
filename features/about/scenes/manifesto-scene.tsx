"use client";

import { Breadcrumbs, Chip, Surface, Typography, cn } from "@heroui/react";
import { aboutAria, aboutCaptions, aboutMarkers, aboutPerson } from "../about-content";

interface SceneProps {
  compact?: boolean;
}

export function ManifestoScene({ compact = false }: SceneProps) {
  return (
    <section
      id="about-manifesto"
      aria-label={aboutAria.manifesto}
      className={cn(
        "relative w-full scroll-mt-24",
        compact ? "py-8" : "flex min-h-[72dvh] flex-col justify-start pt-28 pb-16 sm:pt-32 sm:pb-20"
      )}
    >
      <Surface
        variant="transparent"
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8",
          compact ? "px-0" : "px-5 sm:px-8 lg:px-12"
        )}
      >
        {!compact ? (
          <Breadcrumbs>
            <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
            <Breadcrumbs.Item>About</Breadcrumbs.Item>
          </Breadcrumbs>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {aboutMarkers.map((marker) => (
            <Chip key={marker} size="sm" variant="soft" color="accent">
              {marker}
            </Chip>
          ))}
        </div>

        <Typography
          type="h1"
          weight="bold"
          className={cn(
            "max-w-[12ch] tracking-[-0.06em] text-balance",
            compact
              ? "text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.02]"
              : "text-[clamp(3rem,9vw,6.5rem)] leading-[0.92]"
          )}
        >
          {aboutCaptions.manifesto}
        </Typography>

        <Typography color="muted" type="body-sm" className="font-mono tracking-wide">
          @{aboutPerson.handle}
        </Typography>
      </Surface>
    </section>
  );
}

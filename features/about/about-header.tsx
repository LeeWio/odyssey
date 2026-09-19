"use client";

import { Avatar, Breadcrumbs, Chip, Typography, cn } from "@heroui/react";
import { aboutIntro, aboutMarkers, aboutPerson } from "./about-content";

interface AboutHeaderProps {
  compact?: boolean;
}

export function AboutHeader({ compact = false }: AboutHeaderProps) {
  return (
    <header className="flex flex-col gap-6">
      {!compact ? (
        <Breadcrumbs>
          <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
          <Breadcrumbs.Item>About</Breadcrumbs.Item>
        </Breadcrumbs>
      ) : null}

      <div className="flex items-center gap-4 sm:gap-5">
        <Avatar aria-label={aboutPerson.name} className="size-16 shrink-0 sm:size-20" size="lg">
          <Avatar.Fallback>{aboutPerson.initials}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0">
          <Typography
            type="h1"
            weight="bold"
            className={cn(
              "tracking-[-0.04em] text-balance",
              compact
                ? "text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05]"
                : "text-[clamp(2rem,4.5vw,3rem)] leading-[1.05]"
            )}
          >
            {aboutPerson.name}
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            @{aboutPerson.handle}, {aboutPerson.role}
          </Typography>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {aboutMarkers.map((marker) => (
          <Chip key={marker} size="sm" variant="soft">
            {marker}
          </Chip>
        ))}
      </div>

      <div className="max-w-2xl">
        <Typography type="body" className="text-pretty">
          {aboutIntro.lead}
        </Typography>
        <Typography color="muted" type="body" className="mt-2 text-pretty">
          {aboutIntro.body}
        </Typography>
      </div>
    </header>
  );
}

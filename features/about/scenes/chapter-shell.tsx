"use client";

import type { ReactNode } from "react";
import { Surface, Typography, cn } from "@heroui/react";

export interface ChapterShellProps {
  id: string;
  caption: string;
  ariaLabel: string;
  compact?: boolean;
  children: ReactNode;
  className?: string;
  captionClassName?: string;
}

export function ChapterShell({
  id,
  caption,
  ariaLabel,
  compact = false,
  children,
  className,
  captionClassName,
}: ChapterShellProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "relative w-full scroll-mt-24",
        compact ? "min-h-0 py-10 sm:py-12" : "flex min-h-0 flex-col justify-start py-16 sm:py-24",
        className
      )}
    >
      <Surface
        variant="transparent"
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10",
          compact ? "px-0" : "px-5 sm:px-8 lg:px-12"
        )}
      >
        <Typography
          type="h2"
          weight="bold"
          className={cn(
            "tracking-[-0.05em] text-balance",
            compact
              ? "text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05]"
              : "text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95]",
            captionClassName
          )}
        >
          {caption}
        </Typography>
        {children}
      </Surface>
    </section>
  );
}

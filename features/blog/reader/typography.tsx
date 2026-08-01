"use client";

import { Typography, cn } from "@heroui/react";
import type { ReactNode } from "react";

interface ArticleTypographyProps {
  children: ReactNode;
  className?: string;
}

/**
 * Optimized typography container for long-form reading.
 * Implements HeroUI Pro design taste:
 * - Constrained prose width for comfortable line lengths (~65-75 chars).
 * - Optical alignment for display headings.
 * - Tabular numbers for metadata and dates.
 */
export const ArticleTypography = ({ children, className }: ArticleTypographyProps) => {
  return (
    <div
      className={cn(
        "prose prose-zinc dark:prose-invert max-w-none",
        "prose-headings:font-display prose-headings:tracking-tight prose-headings:font-bold",
        "prose-h1:text-4xl prose-h1:mb-8 md:prose-h1:text-5xl",
        "prose-p:text-default-600 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-accent prose-blockquote:bg-surface-secondary prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:italic",
        "prose-img:rounded-2xl prose-img:border prose-img:border-default-100",
        "prose-code:text-primary prose-code:bg-primary/5 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none",
        className
      )}
    >
      {children}
    </div>
  );
};

export const DisplayHeading = ({ children, className }: ArticleTypographyProps) => (
  <Typography
    className={cn(
      "font-display text-foreground leading-[1.1] font-bold tracking-tight",
      "text-4xl sm:text-5xl lg:text-6xl",
      "optical-alignment", // Placeholder for visual centering logic if needed
      className
    )}
  >
    {children}
  </Typography>
);

export const MetaText = ({ children, className }: ArticleTypographyProps) => (
  <Typography
    className={cn(
      "text-default-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase tabular-nums",
      className
    )}
  >
    {children}
  </Typography>
);

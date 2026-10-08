"use client";

import { Typography, cn } from "@heroui/react";
import type { ReactNode } from "react";

interface ArticleTypographyProps {
  children: ReactNode;
  className?: string;
}

export const ArticleTypography = ({ children, className }: ArticleTypographyProps) => {
  return (
    <Typography.Prose
      className={cn(
        "odyssey-article-prose max-w-none min-w-0 font-sans tracking-normal",
        "[&_:is(h1,h2,h3,h4,h5,h6)]:mt-8 [&_:is(h1,h2,h3,h4,h5,h6)]:mb-4 [&_:is(h1,h2,h3,h4,h5,h6)]:font-sans [&_:is(h1,h2,h3,h4,h5,h6)]:tracking-normal [&_p]:my-4 [&_p]:leading-8",
        className
      )}
    >
      {children}
    </Typography.Prose>
  );
};

export const DisplayHeading = ({ children, className }: ArticleTypographyProps) => (
  <Typography
    className={cn(
      "font-display text-foreground leading-tight font-bold tracking-normal text-balance",
      "text-4xl sm:text-5xl lg:text-6xl",
      className
    )}
  >
    {children}
  </Typography>
);

export const MetaText = ({ children, className }: ArticleTypographyProps) => (
  <Typography
    className={cn("text-muted font-mono text-xs tracking-normal tabular-nums", className)}
  >
    {children}
  </Typography>
);

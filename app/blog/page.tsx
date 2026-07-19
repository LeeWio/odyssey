"use client";

import React from "react";
import { Chip, Surface, Typography } from "@heroui/react";
import { BlogFeed } from "@/components/blog/blog-feed";

export default function BlogListingPage() {
  return (
    <main className="bg-background relative min-h-[calc(100vh-4rem)] w-full overflow-hidden pt-12 pb-24">
      {/* Aesthetic glowing radial gradient spotlight */}
      <div
        aria-hidden="true"
        className="bg-accent/5 dark:bg-accent/10 pointer-events-none absolute top-[-10rem] left-1/2 h-[45rem] w-[45rem] -translate-x-1/2 rounded-full blur-[140px]"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 lg:px-12">
        {/* Header Section */}
        <div className="flex flex-col items-start gap-4">
          <Chip
            size="sm"
            variant="soft"
            color="accent"
            className="font-semibold tracking-wider uppercase"
          >
            Chronicle Hub
          </Chip>
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Odyssey Chronicles
            </h1>
            <p className="text-default-400 max-w-2xl text-base leading-relaxed">
              Logs, analyses, aesthetic reviews, and tech breakdowns compiled systematically to
              anchor the mind in the infinite drift of modern web development.
            </p>
          </div>
        </div>

        {/* Blog Feed Module */}
        <Surface variant="transparent" className="w-full">
          <BlogFeed />
        </Surface>
      </div>
    </main>
  );
}

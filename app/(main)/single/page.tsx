"use client";

import { Chip, Surface } from "@heroui/react";
import { BlogFeed } from "@/features/blog";

export default function SingleIndexPage() {
  return (
    <main className="bg-background relative min-h-[calc(100vh-4rem)] w-full overflow-hidden pt-12 pb-24">
      <BlogFeed />
    </main>
  );
}

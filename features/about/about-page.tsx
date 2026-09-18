"use client";

import { Surface, cn } from "@heroui/react";
import { ManifestoScene } from "./scenes/manifesto-scene";
import { OutroScene } from "./scenes/outro-scene";
import { PersonScene } from "./scenes/person-scene";
import { ProductScene } from "./scenes/product-scene";
import { TasteTimelineScene } from "./scenes/taste-timeline-scene";

interface AboutPageProps {
  compact?: boolean;
}

export function AboutPage({ compact = false }: AboutPageProps) {
  return (
    <Surface variant="transparent" className={cn("w-full", compact ? "pb-8" : "pb-16 sm:pb-24")}>
      <ManifestoScene compact={compact} />
      <PersonScene compact={compact} />
      <ProductScene compact={compact} />
      <TasteTimelineScene compact={compact} />
      <OutroScene compact={compact} />
    </Surface>
  );
}

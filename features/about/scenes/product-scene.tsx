"use client";

import { aboutAria, aboutCaptions } from "../about-content";
import { LandscapeBeat } from "../beats/landscape-beat";
import { ChapterShell } from "./chapter-shell";

interface SceneProps {
  compact?: boolean;
}

export function ProductScene({ compact = false }: SceneProps) {
  return (
    <ChapterShell
      id="about-product"
      caption={aboutCaptions.product}
      ariaLabel={aboutAria.product}
      compact={compact}
    >
      <LandscapeBeat compact={compact} />
    </ChapterShell>
  );
}

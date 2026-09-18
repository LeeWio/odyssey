"use client";

import { aboutAria, aboutCaptions } from "../about-content";
import { AppleDockBeat } from "../beats/apple-dock-beat";
import { CokeAsideBeat } from "../beats/coke-aside-beat";
import { CraftSpineBeat } from "../beats/craft-spine-beat";
import { MusicOnlyBeat } from "../beats/music-only-beat";
import { PlayHubBeat } from "../beats/play-hub-beat";
import { SolitudeBeat } from "../beats/solitude-beat";
import { TrashRefuseBeat } from "../beats/trash-refuse-beat";
import { ChapterShell } from "./chapter-shell";

interface SceneProps {
  compact?: boolean;
}

export function PersonScene({ compact = false }: SceneProps) {
  return (
    <ChapterShell
      id="about-person"
      caption={aboutCaptions.person}
      ariaLabel="Personality defaults told through short motion scenes."
      compact={compact}
      className={compact ? undefined : "py-12 sm:py-16"}
    >
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div aria-label={aboutAria.dock}>
          <AppleDockBeat compact={compact} />
        </div>
        <div aria-label={aboutAria.refuse}>
          <TrashRefuseBeat compact={compact} />
        </div>
        <div aria-label={aboutAria.solitude}>
          <SolitudeBeat compact={compact} />
        </div>
        <div aria-label={aboutAria.play}>
          <PlayHubBeat compact={compact} />
        </div>
        <div aria-label={aboutAria.music}>
          <MusicOnlyBeat compact={compact} />
        </div>
        <div aria-label={aboutAria.coke}>
          <CokeAsideBeat compact={compact} />
        </div>
        <div className="lg:col-span-2" aria-label={aboutAria.craft}>
          <CraftSpineBeat compact={compact} />
        </div>
      </div>
    </ChapterShell>
  );
}

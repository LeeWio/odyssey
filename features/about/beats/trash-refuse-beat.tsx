"use client";

import { useReducedMotion } from "motion/react";
import { Surface, Typography, cn } from "@heroui/react";
import { aboutCaptions } from "../about-content";
import { AndroidSilhouette } from "../marks/android-silhouette";
import { WindowsSilhouette } from "../marks/windows-silhouette";
import { TrashCan } from "../marks/trash-can";
import "./trash-refuse-beat.css";

interface BeatProps {
  compact?: boolean;
}

export function TrashRefuseBeat({ compact = false }: BeatProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div data-about-beat="trash">
      <Surface
        variant="secondary"
        className={cn(
          "border-separator/50 relative overflow-hidden rounded-3xl border p-6 sm:p-8",
          compact ? "min-h-[220px]" : "min-h-[300px]"
        )}
      >
        <Typography type="body-sm" weight="semibold" className="text-muted mb-6 tracking-wide">
          {aboutCaptions.refuse}
        </Typography>

        <div className="relative mx-auto flex h-44 w-full max-w-md items-end justify-center sm:h-52">
          <div
            className={cn(
              "absolute top-2 left-[12%] size-16 sm:size-20",
              reduce ? "about-trash-mark--static" : "about-trash-mark--android"
            )}
          >
            <AndroidSilhouette className="size-full" />
          </div>

          <div
            className={cn(
              "absolute top-4 right-[18%] size-14 sm:size-16",
              reduce ? "about-trash-mark--static" : "about-trash-mark--windows"
            )}
          >
            <WindowsSilhouette className="size-full" />
          </div>

          <div className={cn("relative z-10 origin-top", !reduce && "about-trash-lid")}>
            <TrashCan className="h-28 w-24 sm:h-32 sm:w-28" />
          </div>
        </div>
      </Surface>
    </div>
  );
}

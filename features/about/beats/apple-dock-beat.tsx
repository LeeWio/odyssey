"use client";

import { Surface, Typography, cn } from "@heroui/react";
import { aboutCaptions } from "../about-content";
import { BudsSilhouette, MacSilhouette, PhoneSilhouette } from "../marks/device-silhouettes";

interface BeatProps {
  compact?: boolean;
}

const devices = [
  { id: "mac", node: MacSilhouette, className: "h-14 w-20 sm:h-16 sm:w-24" },
  { id: "phone", node: PhoneSilhouette, className: "h-16 w-9 sm:h-20 sm:w-11" },
  { id: "buds", node: BudsSilhouette, className: "h-12 w-16 sm:h-14 sm:w-20" },
] as const;

export function AppleDockBeat({ compact = false }: BeatProps) {
  return (
    <Surface
      variant="secondary"
      className={cn(
        "border-separator/50 overflow-hidden rounded-3xl border p-6 sm:p-8",
        compact ? "min-h-[200px]" : "min-h-[260px]"
      )}
    >
      <Typography type="body-sm" weight="semibold" className="text-muted mb-8 tracking-wide">
        {aboutCaptions.dock}
      </Typography>

      <div className="relative mx-auto flex max-w-lg items-end justify-center gap-6 sm:gap-8">
        {devices.map((device) => {
          const Icon = device.node;
          return (
            <div key={device.id} className="relative z-10">
              <Icon className={device.className} />
            </div>
          );
        })}
      </div>

      <div className="bg-foreground/10 mx-auto mt-8 h-3 w-full max-w-sm rounded-full" />
    </Surface>
  );
}

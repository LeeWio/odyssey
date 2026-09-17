"use client";

import type { CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { HoloCard } from "@heroui-pro/react";
import { Compass } from "@gravity-ui/icons";
import { aboutPerson } from "./about-content";

const PASS_GRADIENT =
  "linear-gradient(145deg, rgb(28, 28, 30) 0%, rgb(44, 44, 46) 42%, rgb(10, 10, 12) 100%)";

const passSizes: Record<"default" | "compact", CSSProperties> = {
  default: {
    ["--holo-card-bleed" as string]: "28px",
    ["--holo-card-height" as string]: "420px",
    ["--holo-card-radius" as string]: "22px",
    ["--holo-card-width" as string]: "280px",
  },
  compact: {
    ["--holo-card-bleed" as string]: "20px",
    ["--holo-card-height" as string]: "320px",
    ["--holo-card-radius" as string]: "18px",
    ["--holo-card-width" as string]: "214px",
  },
};

interface AboutHoloPassProps {
  className?: string;
  size?: keyof typeof passSizes;
}

export function AboutHoloPass({ className, size = "default" }: AboutHoloPassProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <HoloCard
      className={className}
      gradient={PASS_GRADIENT}
      isInteractive={!shouldReduceMotion}
      style={passSizes[size]}
    >
      <HoloCard.Rotator>
        <HoloCard.Frame>
          <HoloCard.Surface>
            <HoloCard.Inset />
            <HoloCard.Pattern />

            <HoloCard.Content className="justify-center pt-10">
              <Compass className="size-6 text-white/45 mix-blend-soft-light" />
            </HoloCard.Content>

            <HoloCard.Content className="flex-col items-center justify-center gap-1 px-6 text-center">
              <span className="text-[10px] font-medium tracking-[0.22em] text-white/35 uppercase">
                Odyssey Pass
              </span>
              <span className="text-3xl font-bold tracking-tight text-white">
                {aboutPerson.name}
              </span>
              <span className="text-[11px] font-medium text-white/45">{aboutPerson.role}</span>
              <span className="mt-2 text-[10px] tracking-[0.16em] text-white/35 uppercase">
                {aboutPerson.markers.join(" · ")}
              </span>
            </HoloCard.Content>

            <HoloCard.Content className="items-end justify-center pb-10">
              <div className="flex w-[220px] justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium text-white/30">Handle</span>
                  <span className="text-sm font-semibold text-white/55">@{aboutPerson.handle}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] font-medium text-white/30">Status</span>
                  <span className="text-sm font-semibold text-white/55">{aboutPerson.badge}</span>
                </div>
              </div>
            </HoloCard.Content>

            <HoloCard.Shine />
          </HoloCard.Surface>
        </HoloCard.Frame>
      </HoloCard.Rotator>
    </HoloCard>
  );
}

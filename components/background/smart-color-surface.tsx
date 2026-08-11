"use client";

import { Surface, cn } from "@heroui/react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";

export type SmartColorTone = "coding" | "design" | "investing" | "life" | "music" | "neutral";

type SmartColorSubject = {
  categoryName?: string | null;
  title: string;
};

type SmartPalette = {
  base: string;
  colors: readonly [string, string, string, string];
};

type SmartColorSurfaceProps = {
  children?: ReactNode;
  className?: string;
  seed: string;
  tone?: SmartColorTone;
};

const PALETTES: Record<SmartColorTone, readonly SmartPalette[]> = {
  coding: [
    {
      base: "#062f36",
      colors: ["#7ddf64", "#20b7a5", "#1667a8", "#081f3f"],
    },
    {
      base: "#10283d",
      colors: ["#4be0c2", "#57a7d9", "#8bd450", "#14385f"],
    },
  ],
  design: [
    {
      base: "#a84d68",
      colors: ["#f4c96c", "#ef8c76", "#64d8c5", "#9c70ce"],
    },
    {
      base: "#8c4d61",
      colors: ["#efaf62", "#df6d85", "#75c7bd", "#657ebc"],
    },
  ],
  investing: [
    {
      base: "#4b255e",
      colors: ["#e9b653", "#d65d73", "#824ea8", "#3b416f"],
    },
    {
      base: "#26384d",
      colors: ["#d9a84d", "#5ab6a2", "#b85f65", "#46588d"],
    },
  ],
  life: [
    {
      base: "#33466f",
      colors: ["#81b8d6", "#7a70c9", "#d1788e", "#435b8f"],
    },
    {
      base: "#55405f",
      colors: ["#d69a77", "#91b9c5", "#8c6db0", "#545f8e"],
    },
  ],
  music: [
    {
      base: "#25366f",
      colors: ["#27b5c7", "#3f65cc", "#9d4fc0", "#d55683"],
    },
    {
      base: "#3d286e",
      colors: ["#476bd1", "#2fb8bb", "#bd4d94", "#6953b6"],
    },
  ],
  neutral: [
    {
      base: "#35404a",
      colors: ["#6aa99e", "#7d8fc0", "#b07c78", "#52616f"],
    },
    {
      base: "#3f3e52",
      colors: ["#9a8e72", "#6c9b9a", "#8a75a7", "#58697a"],
    },
  ],
};

const BLOB_PATHS = [
  { duration: 19, rotation: 18, scale: 1.16, x: 24, y: -18 },
  { duration: 23, rotation: -22, scale: 1.22, x: -20, y: 22 },
  { duration: 27, rotation: 14, scale: 1.12, x: 16, y: 20 },
] as const;

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getSmartColorTone({ categoryName, title }: SmartColorSubject): SmartColorTone {
  const source = `${categoryName ?? ""} ${title}`.toLowerCase();

  if (/music|song|audio|音乐|歌曲/.test(source)) return "music";
  if (/design|ui|ux|设计/.test(source)) return "design";
  if (/market|invest|stock|finance|投资|市场/.test(source)) return "investing";
  if (/code|develop|javascript|typescript|react|java|编程|开发/.test(source)) return "coding";
  if (/life|travel|training|生活|旅行|训练/.test(source)) return "life";
  return "neutral";
}

export function SmartColorSurface({
  children,
  className,
  seed,
  tone = "neutral",
}: SmartColorSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.1, margin: "120px" });
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = isInView && !shouldReduceMotion;
  const seedHash = useMemo(() => hashSeed(`${tone}:${seed}`), [seed, tone]);
  const paletteOptions = PALETTES[tone];
  const palette = paletteOptions[seedHash % paletteOptions.length]!;
  const phase = (seedHash % 1000) / 1000;
  const colors = useMemo(() => {
    const shift = seedHash % palette.colors.length;

    return palette.colors.map(
      (_, index) => palette.colors[(index + shift) % palette.colors.length]!
    );
  }, [palette.colors, seedHash]);

  return (
    <Surface
      ref={rootRef}
      data-smart-color-seed={seed}
      data-smart-color-tone={tone}
      className={cn(
        "relative isolate overflow-hidden bg-[var(--smart-color-base)] text-white",
        className
      )}
      style={{ "--smart-color-base": palette.base } as CSSProperties}
      variant="transparent"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOB_PATHS.map((path, index) => {
          const direction = (seedHash + index) % 2 === 0 ? 1 : -1;
          const blobBackground =
            index === 2 ? `linear-gradient(135deg, ${colors[2]}, ${colors[3]})` : colors[index];
          const blobClassName = [
            "absolute rounded-full will-change-transform",
            index === 0 && "-top-1/3 -left-1/4 size-[85%] opacity-90 blur-[42px] sm:blur-[58px]",
            index === 1 &&
              "-right-1/3 -bottom-1/4 size-[92%] opacity-85 blur-[48px] sm:blur-[64px]",
            index === 2 && "top-1/4 left-1/4 size-[76%] opacity-75 blur-[52px] sm:blur-[72px]",
          ];

          return (
            <motion.div
              key={`${seed}-${index}`}
              data-smart-color-blob={index}
              animate={
                shouldAnimate
                  ? {
                      rotate: [path.rotation * -0.35 * direction, path.rotation * direction],
                      scale: [0.94, path.scale],
                      x: [`${path.x * -0.45}%`, `${path.x * direction}%`],
                      y: [`${path.y * -0.45}%`, `${path.y * direction}%`],
                    }
                  : {
                      rotate: 0,
                      scale: 1,
                      x: "0%",
                      y: "0%",
                    }
              }
              className={cn(blobClassName)}
              initial={false}
              style={{ background: blobBackground }}
              transition={{
                delay: -path.duration * ((phase + index * 0.21) % 1),
                duration: shouldAnimate ? path.duration : 0,
                ease: [0.45, 0, 0.55, 1],
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
              }}
            />
          );
        })}
        <motion.div
          data-smart-color-glow
          animate={
            shouldAnimate
              ? {
                  opacity: [0.42, 0.72],
                  scale: [0.92, 1.08],
                }
              : {
                  opacity: 0.54,
                  scale: 1,
                }
          }
          className="absolute inset-[-20%] bg-[radial-gradient(circle_at_50%_42%,rgb(255_255_255/0.24),transparent_48%)] will-change-transform"
          initial={false}
          transition={{
            delay: -11 * phase,
            duration: shouldAnimate ? 11 : 0,
            ease: [0.45, 0, 0.55, 1],
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(150deg,rgb(8_12_24/0.02),rgb(8_12_24/0.16)_58%,rgb(8_12_24/0.46))]" />
        <div className="absolute inset-px rounded-[inherit] border border-white/14 shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]" />
      </div>
      <div className="relative z-[1] h-full w-full">{children}</div>
    </Surface>
  );
}

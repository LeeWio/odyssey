"use client";

import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { useMounted } from "@mantine/hooks";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@heroui/react";

export type MeshTone = "coding" | "design" | "investing" | "life" | "music" | "neutral";

export interface MeshGradientProps {
  children?: ReactNode;
  className?: string;
  seed: string;
  tone?: MeshTone;
  animated?: boolean;
}

interface MeshPalette {
  base: string;
  blobs: readonly string[];
}

const PALETTES: Record<MeshTone, readonly MeshPalette[]> = {
  coding: [
    // Midnight Blue-Teal (IMG_5379.jpg inspired)
    {
      base: "#041424",
      blobs: ["#023f33", "#0ca37f", "#04a89f", "#0c2e4f"],
    },
    {
      base: "#020f1c",
      blobs: ["#125e70", "#18a5aa", "#5fcfa2", "#021d36"],
    },
  ],
  design: [
    // Vibrant Peach Rose & Coral Pink (IMG_5380.jpg inspired)
    {
      base: "#1a0810",
      blobs: ["#ff4260", "#ff6b3d", "#bd1139", "#fa7d61"],
    },
    {
      base: "#180415",
      blobs: ["#db2c70", "#8e12a6", "#ff6be0", "#ed3b4f"],
    },
  ],
  investing: [
    {
      base: "#0a031c",
      blobs: ["#7612aa", "#c98f12", "#b32252", "#350552"],
    },
    {
      base: "#08101f",
      blobs: ["#c7850e", "#248f72", "#912236", "#223f61"],
    },
  ],
  life: [
    {
      base: "#050b1f",
      blobs: ["#407ea3", "#51469c", "#a84059", "#152147"],
    },
    {
      base: "#11061c",
      blobs: ["#a8572c", "#558899", "#5f309c", "#241d47"],
    },
  ],
  music: [
    {
      base: "#020721",
      blobs: ["#0b90a3", "#163ca3", "#7416a3", "#b31a52"],
    },
    {
      base: "#120330",
      blobs: ["#2445ad", "#179699", "#911667", "#3b1e7a"],
    },
  ],
  neutral: [
    {
      base: "#0a1017",
      blobs: ["#366e63", "#4b5c87", "#874e49", "#23303d"],
    },
    {
      base: "#0f0e17",
      blobs: ["#70664c", "#386a6b", "#5e4580", "#232e3d"],
    },
  ],
};

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function MeshGradient({
  children,
  className,
  seed,
  tone = "neutral",
  animated = true,
}: MeshGradientProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.1, margin: "100px" });
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = isInView && animated && !shouldReduceMotion;
  const isMounted = useMounted();

  const seedHash = useMemo(() => hashSeed(`${tone}:${seed}`), [seed, tone]);
  const paletteOptions = PALETTES[tone];
  const palette = paletteOptions[seedHash % paletteOptions.length]!;

  // Generate deterministic coordinates and sizes for 4 distinct blobs based on the seed
  const blobs = useMemo(() => {
    return palette.blobs.map((color, index) => {
      // Deterministic placement percentage bounds
      const h1 = hashSeed(`${seedHash}:${index}:x`);
      const h2 = hashSeed(`${seedHash}:${index}:y`);
      const h3 = hashSeed(`${seedHash}:${index}:r`);

      const initialCx = 15 + (h1 % 70); // Keep centered in bounds [15, 85]
      const initialCy = 15 + (h2 % 70);
      const initialR = 30 + (h3 % 30); // Radius bound [30, 60]

      // Animation parameters
      const duration = 18 + (h1 % 16); // Duration bound [18, 34] seconds
      const directionX = h2 % 2 === 0 ? 1 : -1;
      const directionY = h3 % 2 === 0 ? 1 : -1;

      // Keyframes drift
      const driftX = [
        `${initialCx}%`,
        `${initialCx + 12 * directionX}%`,
        `${initialCx - 8 * directionX}%`,
        `${initialCx}%`,
      ];
      const driftY = [
        `${initialCy}%`,
        `${initialCy - 10 * directionY}%`,
        `${initialCy + 14 * directionY}%`,
        `${initialCy}%`,
      ];
      const driftR = [initialR, initialR + 8, initialR - 5, initialR];

      return {
        color,
        cx: driftX,
        cy: driftY,
        r: driftR,
        duration,
        phase: (h1 % 100) / 100,
      };
    });
  }, [palette.blobs, seedHash]);

  if (!isMounted) {
    return (
      <div
        className={cn("relative overflow-hidden bg-neutral-950", className)}
        style={{ backgroundColor: palette.base }}
      >
        <div className="relative z-[1] h-full w-full">{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative isolate overflow-hidden", className)}
      style={{ backgroundColor: palette.base }}
    >
      {/* Background SVG Canvas Layer */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definitions: Blurring filter and Film Noise Turbulence filter */}
        <defs>
          <filter
            id={`blur-${seedHash}`}
            filterUnits="userSpaceOnUse"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="64" />
          </filter>
          <filter id={`grain-${seedHash}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.07 0" />
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Blurred Blobs Layer Group */}
        <g filter={`url(#blur-${seedHash})`}>
          {blobs.map((blob, index) => (
            <motion.circle
              key={`${seedHash}-${index}`}
              animate={
                shouldAnimate
                  ? {
                      cx: blob.cx,
                      cy: blob.cy,
                      r: blob.r,
                    }
                  : {
                      cx: blob.cx[0],
                      cy: blob.cy[0],
                      r: blob.r[0],
                    }
              }
              fill={blob.color}
              initial={false}
              opacity={0.82}
              transition={{
                delay: -blob.duration * blob.phase,
                duration: shouldAnimate ? blob.duration : 0,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
              }}
            />
          ))}
        </g>

        {/* Premium Paper Grain Overlays */}
        <rect
          width="100%"
          height="100%"
          filter={`url(#grain-${seedHash})`}
          className="opacity-30 mix-blend-overlay"
        />
      </svg>

      {/* Surface Gradient Shade */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/40" />

      {/* Card Rim Shadow Border (Matches Premium Design Taste) */}
      <div className="pointer-events-none absolute inset-px rounded-[inherit] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />

      {/* Children Content slot */}
      <div className="relative z-[1] h-full w-full">{children}</div>
    </div>
  );
}

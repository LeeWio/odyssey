"use client";

import {
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type FluidBackdropProps = {
  scrollYProgress: MotionValue<number>;
};

export function FluidBackdrop({ scrollYProgress }: FluidBackdropProps) {
  const shouldReduceMotion = useReducedMotion();
  const reducedMotion = Boolean(shouldReduceMotion);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Initialize mouse coordinates as MotionValues (performance-optimized, avoids React re-renders)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Avoid hydration mismatch and set mounted state
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Set mouse tracking
  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize coordinate offset to range [-0.5, 0.5] relative to center of viewport
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [reducedMotion, mouseX, mouseY]);

  // Use a highly refined physics spring to damp the scroll.
  // Fine-tuned to be ultra-sluggish and ethereal for deep reading focus (Suggestion 3).
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 3,
    damping: 35,
    mass: 4.0,
    restDelta: 0.0001,
  });

  // Extremely sluggish springs for mouse-following offset to prevent snappy cursor movements from distracting
  const mouseSpringX = useSpring(mouseX, { stiffness: 2.5, damping: 20, mass: 3.5 });
  const mouseSpringY = useSpring(mouseY, { stiffness: 2.5, damping: 20, mass: 3.5 });

  const isDark = !mounted || resolvedTheme === "dark";

  // =========================================================================
  // OPACITY CROSSFADE CHANNELS WITH ASYMMETRIC STAGGERING
  // We define 4 states (Chapter 0, 1, 2, 3) and crossfade their opacities in JS.
  // Each child contains a radial gradient styled ONLY with official HeroUI semantic variables.
  // This eliminates hardcoded colors from JS and ensures perfect theme reactivity.
  // =========================================================================

  // --- Blob 1 Opacity Channels (Aligned with reading flow: 0-15% Intro, 15-45% Reading, 45-75% Climax, 75-100% Outro/Comments) ---
  const b1_op0 = useTransform(smoothScroll, [-0.2, 0, 0.15, 0.45], [1, 1, 0, 0]);
  const b1_op1 = useTransform(smoothScroll, [0, 0.15, 0.45, 0.75], [0, 1, 0, 0]);
  const b1_op2 = useTransform(smoothScroll, [0.15, 0.45, 0.75, 0.9], [0, 1, 0, 0]);
  const b1_op3 = useTransform(smoothScroll, [0.45, 0.75, 0.9, 1.2], [0, 0, 1, 1]);

  // --- Blob 2 Opacity Channels ---
  const b2_op0 = useTransform(smoothScroll, [-0.2, 0, 0.2, 0.5], [1, 1, 0, 0]);
  const b2_op1 = useTransform(smoothScroll, [0, 0.2, 0.5, 0.8], [0, 1, 0, 0]);
  const b2_op2 = useTransform(smoothScroll, [0.2, 0.5, 0.8, 0.92], [0, 1, 0, 0]);
  const b2_op3 = useTransform(smoothScroll, [0.5, 0.8, 0.92, 1.2], [0, 0, 1, 1]);

  // --- Blob 3 Opacity Channels ---
  const b3_op0 = useTransform(smoothScroll, [-0.2, 0, 0.18, 0.48], [1, 1, 0, 0]);
  const b3_op1 = useTransform(smoothScroll, [0, 0.18, 0.48, 0.78], [0, 1, 0, 0]);
  const b3_op2 = useTransform(smoothScroll, [0.18, 0.48, 0.78, 0.91], [0, 1, 0, 0]);
  const b3_op3 = useTransform(smoothScroll, [0.48, 0.78, 0.91, 1.2], [0, 0, 1, 1]);

  // =========================================================================
  // MULTI-DIMENSIONAL PARALLAX MOUSE-FOLLOW DRIFT
  // We map the scroll-driven positions as numeric percentages first,
  // then merge them mathematically with the damped mouse spring offset.
  // =========================================================================

  // Scroll positions as raw numeric coordinate pathways (percentages)
  const scrollX1 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [15, 60, 25, 85]);
  const scrollY1 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [10, 15, 38, 3]);

  const scrollX2 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [75, 10, 80, 15]);
  const scrollY2 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [60, 45, 20, 75]);

  const scrollX3 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [45, 55, 10, 75]);
  const scrollY3 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [40, 75, 10, 85]);

  // Combined scroll + mouse coordinates (disabled in reduced-motion)
  const finalX1 = useTransform([scrollX1, mouseSpringX], (values: readonly number[]) => {
    const sX = values[0];
    const mX = values[1];
    return `${sX + (reducedMotion ? 0 : mX * 8)}vw`;
  });
  const finalY1 = useTransform([scrollY1, mouseSpringY], (values: readonly number[]) => {
    const sY = values[0];
    const mY = values[1];
    return `${sY + (reducedMotion ? 0 : mY * 8)}vh`;
  });

  // Blob 2 uses OPPOSITE multiplier (* -10) to create physical sliding volume!
  const finalX2 = useTransform([scrollX2, mouseSpringX], (values: readonly number[]) => {
    const sX = values[0];
    const mX = values[1];
    return `${sX + (reducedMotion ? 0 : mX * -10)}vw`;
  });
  const finalY2 = useTransform([scrollY2, mouseSpringY], (values: readonly number[]) => {
    const sY = values[0];
    const mY = values[1];
    return `${sY + (reducedMotion ? 0 : mY * -10)}vh`;
  });

  const finalX3 = useTransform([scrollX3, mouseSpringX], (values: readonly number[]) => {
    const sX = values[0];
    const mX = values[1];
    return `${sX + (reducedMotion ? 0 : mX * 6)}vw`;
  });
  const finalY3 = useTransform([scrollY3, mouseSpringY], (values: readonly number[]) => {
    const sY = values[0];
    const mY = values[1];
    return `${sY + (reducedMotion ? 0 : mY * 6)}vh`;
  });

  const spotlightLeft = useTransform(mouseSpringX, (x: number) => `${(x + 0.5) * 100}%`);
  const spotlightTop = useTransform(mouseSpringY, (y: number) => `${(y + 0.5) * 100}%`);

  const s1 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [1.0, 1.35, 1.6, 1.15]);
  const s2 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [1.1, 1.45, 1.15, 1.55]);
  const s3 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [0.8, 1.2, 1.5, 1.2]);

  // Ultra-low contrast opacities for a ghostly, non-distracting thin mist (Suggestion 1)
  const opacity1 = isDark ? 0.08 : 0.1;
  const opacity2 = isDark ? 0.09 : 0.11;
  const opacity3 = isDark ? 0.05 : 0.06;

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
      className="bg-background pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden transition-colors duration-1000"
    >
      {/* Dynamic CSS Keyframe Injection for Organic wobble animations (GPU accelerated) */}
      <style>{`
        @keyframes wobble-slow {
          0%, 100% {
            transform: rotate(0deg) scale(1) translate(0px, 0px);
          }
          33% {
            transform: rotate(120deg) scale(1.1) translate(3%, -4%);
          }
          66% {
            transform: rotate(240deg) scale(0.95) translate(-4%, 3%);
          }
        }
        @keyframes wobble-medium {
          0%, 100% {
            transform: rotate(360deg) scale(1.15) translate(0px, 0px);
          }
          33% {
            transform: rotate(240deg) scale(0.9) translate(-5%, 4%);
          }
          66% {
            transform: rotate(120deg) scale(1.05) translate(4%, -5%);
          }
        }
        @keyframes wobble-fast {
          0%, 100% {
            transform: rotate(0deg) scale(1.05) translate(0px, 0px);
          }
          50% {
            transform: rotate(180deg) scale(0.9) translate(-3%, -3%);
          }
        }
        .liquid-layer {
          mix-blend-mode: ${isDark ? "screen" : "normal"};
        }
      `}</style>

      {/* Dynamic Aurora Blobs */}
      <div className="liquid-layer absolute inset-0 h-full w-full">
        {/* ==================== BLOB 1 (Top-Heavy Swirling Core) ==================== */}
        <motion.div
          style={{
            x: finalX1,
            y: finalY1,
            scale: s1,
            opacity: opacity1,
          }}
          className="animate-gpu absolute size-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[200px] transition-opacity duration-1000 ease-out"
        >
          <motion.div
            className="relative h-full w-full overflow-hidden rounded-full"
            animate={
              reducedMotion
                ? undefined
                : {
                    animation: "wobble-slow 24s infinite ease-in-out",
                  }
            }
          >
            {/* Odyssey State (0) -> Accent (Primary) to Danger (Rose) to Base Background */}
            <motion.div
              style={{
                opacity: b1_op0,
                background:
                  "radial-gradient(circle at 35% 35%, var(--accent) 0%, var(--danger) 50%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Chronicle State (1) -> Success (Emerald) to Accent (Primary) to Base Background */}
            <motion.div
              style={{
                opacity: b1_op1,
                background:
                  "radial-gradient(circle at 35% 35%, var(--success) 0%, var(--accent) 50%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Orbit State (2) -> Warning (Amber) to Danger (Rose) to Base Background */}
            <motion.div
              style={{
                opacity: b1_op2,
                background:
                  "radial-gradient(circle at 35% 35%, var(--warning) 0%, var(--danger) 50%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Travelogue State (3) -> Accent (Primary) to Default to Base Background */}
            <motion.div
              style={{
                opacity: b1_op3,
                background:
                  "radial-gradient(circle at 35% 35%, var(--accent) 0%, var(--default) 60%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
          </motion.div>
        </motion.div>

        {/* ==================== BLOB 2 (Bottom-Heavy Aurora) ==================== */}
        <motion.div
          style={{
            x: finalX2,
            y: finalY2,
            scale: s2,
            opacity: opacity2,
          }}
          className="animate-gpu absolute size-[65rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[220px] transition-opacity duration-1000 ease-out"
        >
          <motion.div
            className="relative h-full w-full overflow-hidden rounded-full"
            animate={
              reducedMotion
                ? undefined
                : {
                    animation: "wobble-medium 30s infinite ease-in-out",
                  }
            }
          >
            {/* Odyssey State (0) -> Danger (Rose) to Accent (Primary) to Base Background */}
            <motion.div
              style={{
                opacity: b2_op0,
                background:
                  "radial-gradient(circle at 65% 65%, var(--danger) 0%, var(--accent) 50%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Chronicle State (1) -> Accent (Primary) to Success (Emerald) to Base Background */}
            <motion.div
              style={{
                opacity: b2_op1,
                background:
                  "radial-gradient(circle at 65% 65%, var(--accent) 0%, var(--success) 50%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Orbit State (2) -> Danger (Rose) to Warning (Amber) to Base Background */}
            <motion.div
              style={{
                opacity: b2_op2,
                background:
                  "radial-gradient(circle at 65% 65%, var(--danger) 0%, var(--warning) 50%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Travelogue State (3) -> Success (Emerald) to Default to Base Background */}
            <motion.div
              style={{
                opacity: b2_op3,
                background:
                  "radial-gradient(circle at 65% 65%, var(--success) 0%, var(--default) 60%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
          </motion.div>
        </motion.div>

        {/* ==================== BLOB 3 (Center-Mid Stabilizer) ==================== */}
        <motion.div
          style={{
            x: finalX3,
            y: finalY3,
            scale: s3,
            opacity: opacity3,
          }}
          className="animate-gpu absolute size-[70rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[240px] transition-opacity duration-1000 ease-out"
        >
          <motion.div
            className="relative h-full w-full overflow-hidden rounded-full"
            animate={
              reducedMotion
                ? undefined
                : {
                    animation: "wobble-fast 18s infinite ease-in-out",
                  }
            }
          >
            {/* Odyssey State (0) -> Default to Base Background to Base Background */}
            <motion.div
              style={{
                opacity: b3_op0,
                background:
                  "radial-gradient(circle at 50% 50%, var(--default) 0%, var(--background) 70%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Chronicle State (1) -> Default to Base Background to Base Background */}
            <motion.div
              style={{
                opacity: b3_op1,
                background:
                  "radial-gradient(circle at 50% 50%, var(--default) 0%, var(--background) 70%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Orbit State (2) -> Default to Base Background to Base Background */}
            <motion.div
              style={{
                opacity: b3_op2,
                background:
                  "radial-gradient(circle at 50% 50%, var(--default) 0%, var(--background) 70%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
            {/* Travelogue State (3) -> Base Background to Default to Base Background */}
            <motion.div
              style={{
                opacity: b3_op3,
                background:
                  "radial-gradient(circle at 50% 50%, var(--background) 0%, var(--default) 70%, var(--background) 100%)",
              }}
              className="absolute inset-0 h-full w-full rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Dynamic Cursor Spotlight Overlay */}
      {!reducedMotion && (
        <motion.div
          style={{
            left: spotlightLeft,
            top: spotlightTop,
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          }}
          className="pointer-events-none fixed size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-[60px] dark:opacity-[0.06]"
        />
      )}

      {/* SVG Paper Micro-Noise Overlay (Editorial Tactile Texture) */}
      <div
        className="pointer-events-none absolute inset-0 h-full w-full bg-repeat opacity-[0.015] mix-blend-overlay dark:opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </motion.div>
  );
}

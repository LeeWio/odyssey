"use client";

import { motion, useReducedMotion, useSpring, useTransform, MotionValue } from "motion/react";
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

  // Avoid hydration mismatch for theme checking
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a highly refined physics spring to damp the scroll. 
  // Lower stiffness and higher damping create a luscious, slow-motion liquid swell.
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 24,
    damping: 18,
    mass: 1.2,
    restDelta: 0.0001,
  });

  const isDark = !mounted || resolvedTheme === "dark";

  // =========================================================================
  // OPACITY CROSSFADE CHANNELS WITH ASYMMETRIC STAGGERING
  // We define 4 states (Chapter 0, 1, 2, 3) and crossfade their opacities in JS.
  // Each child contains a radial gradient styled ONLY with HeroUI semantic variables.
  // This eliminates hardcoded colors from JS and ensures perfect theme reactivity.
  // =========================================================================

  // --- Blob 1 Opacity Channels (Shifts earlier: nodes at 0.00, 0.28, 0.60, 0.90) ---
  const b1_op0 = useTransform(smoothScroll, [-0.2, 0, 0.28, 0.60], [1, 1, 0, 0]);
  const b1_op1 = useTransform(smoothScroll, [0, 0.28, 0.60, 0.90], [0, 1, 0, 0]);
  const b1_op2 = useTransform(smoothScroll, [0.28, 0.60, 0.90, 1.20], [0, 1, 0, 0]);
  const b1_op3 = useTransform(smoothScroll, [0.60, 0.90, 1.00, 1.20], [0, 0, 1, 1]);

  // --- Blob 2 Opacity Channels (Shifts later: nodes at 0.00, 0.38, 0.70, 1.00) ---
  const b2_op0 = useTransform(smoothScroll, [-0.2, 0, 0.38, 0.70], [1, 1, 0, 0]);
  const b2_op1 = useTransform(smoothScroll, [0, 0.38, 0.70, 1.00], [0, 1, 0, 0]);
  const b2_op2 = useTransform(smoothScroll, [0.38, 0.70, 1.00, 1.20], [0, 1, 0, 0]);
  const b2_op3 = useTransform(smoothScroll, [0.70, 1.00, 1.10, 1.30], [0, 0, 1, 1]);

  // --- Blob 3 Opacity Channels (Standard spacing: nodes at 0.00, 0.33, 0.66, 1.00) ---
  const b3_op0 = useTransform(smoothScroll, [-0.2, 0, 0.33, 0.66], [1, 1, 0, 0]);
  const b3_op1 = useTransform(smoothScroll, [0, 0.33, 0.66, 1.00], [0, 1, 0, 0]);
  const b3_op2 = useTransform(smoothScroll, [0.33, 0.66, 1.00, 1.20], [0, 1, 0, 0]);
  const b3_op3 = useTransform(smoothScroll, [0.66, 1.00, 1.10, 1.30], [0, 0, 1, 1]);

  // =========================================================================
  // PHYSICAL COORDINATE FLOATING / SWIRLING OFFSET
  // Positions drift asymmetricaly during scroll.
  // =========================================================================

  // Blob 1 coordinates (top-heavy drift)
  const x1 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], ["15vw", "60vw", "25vw", "85vw"]);
  const y1 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], ["10vh", "15vh", "38vh", "3vh"]);
  const s1 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [1.0, 1.35, 1.6, 1.15]);
  
  // Since gradients now fade perfectly to transparent at the 100% boundary stop,
  // we can bump up the parent layer's opacity. This makes the core of the orbs
  // rich and beautifully saturated while ensuring feather-soft blending with the background.
  const opacity1 = isDark ? 0.28 : 0.34;

  // Blob 2 coordinates (bottom-heavy drift)
  const x2 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], ["75vw", "10vw", "80vw", "15vw"]);
  const y2 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], ["60vh", "45vh", "20vh", "75vh"]);
  const s2 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [1.1, 1.45, 1.15, 1.55]);
  const opacity2 = isDark ? 0.30 : 0.38;

  // Blob 3 coordinates (center-mid stabilizer)
  const x3 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], ["45vw", "55vw", "10vw", "75vw"]);
  const y3 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], ["40vh", "75vh", "10vh", "85vh"]);
  const s3 = useTransform(smoothScroll, [0, 0.33, 0.66, 1], [0.8, 1.2, 1.5, 1.2]);
  const opacity3 = isDark ? 0.20 : 0.26;

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
      className="bg-background fixed inset-0 z-0 h-screen w-screen overflow-hidden pointer-events-none transition-colors duration-1000"
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
      <div className="liquid-layer absolute inset-0 w-full h-full">
        
        {/* ==================== BLOB 1 (Top-Heavy Swirling Core) ==================== */}
        <motion.div
          style={{
            x: reducedMotion ? "15vw" : x1,
            y: reducedMotion ? "10vh" : y1,
            scale: s1,
            opacity: opacity1,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px] size-[38rem] transition-opacity duration-1000 ease-out animate-gpu"
        >
          <motion.div
            className="w-full h-full rounded-full relative overflow-hidden"
            animate={reducedMotion ? undefined : {
              animation: "wobble-slow 24s infinite ease-in-out"
            }}
          >
            {/* Odyssey State (0) -> Accent (Primary) to Danger (Rose) to transparent */}
            <motion.div
              style={{
                opacity: b1_op0,
                background: "radial-gradient(circle at 35% 35%, var(--accent) 0%, var(--danger) 50%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Chronicle State (1) -> Success (Emerald) to Accent (Primary) to transparent */}
            <motion.div
              style={{
                opacity: b1_op1,
                background: "radial-gradient(circle at 35% 35%, var(--success) 0%, var(--accent) 50%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Orbit State (2) -> Warning (Amber) to Danger (Rose) to transparent */}
            <motion.div
              style={{
                opacity: b1_op2,
                background: "radial-gradient(circle at 35% 35%, var(--warning) 0%, var(--danger) 50%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Travelogue State (3) -> Accent (Primary) to Surface-Tertiary to transparent */}
            <motion.div
              style={{
                opacity: b1_op3,
                background: "radial-gradient(circle at 35% 35%, var(--accent) 0%, var(--surface-tertiary) 60%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
          </motion.div>
        </motion.div>

        {/* ==================== BLOB 2 (Bottom-Heavy Aurora) ==================== */}
        <motion.div
          style={{
            x: reducedMotion ? "75vw" : x2,
            y: reducedMotion ? "60vh" : y2,
            scale: s2,
            opacity: opacity2,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] size-[40rem] transition-opacity duration-1000 ease-out animate-gpu"
        >
          <motion.div
            className="w-full h-full rounded-full relative overflow-hidden"
            animate={reducedMotion ? undefined : {
              animation: "wobble-medium 30s infinite ease-in-out"
            }}
          >
            {/* Odyssey State (0) -> Danger (Rose) to Accent (Primary) to transparent */}
            <motion.div
              style={{
                opacity: b2_op0,
                background: "radial-gradient(circle at 65% 65%, var(--danger) 0%, var(--accent) 50%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Chronicle State (1) -> Accent (Primary) to Success (Emerald) to transparent */}
            <motion.div
              style={{
                opacity: b2_op1,
                background: "radial-gradient(circle at 65% 65%, var(--accent) 0%, var(--success) 50%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Orbit State (2) -> Danger (Rose) to Warning (Amber) to transparent */}
            <motion.div
              style={{
                opacity: b2_op2,
                background: "radial-gradient(circle at 65% 65%, var(--danger) 0%, var(--warning) 50%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Travelogue State (3) -> Success (Emerald) to Background-Secondary to transparent */}
            <motion.div
              style={{
                opacity: b2_op3,
                background: "radial-gradient(circle at 65% 65%, var(--success) 0%, var(--background-secondary) 60%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
          </motion.div>
        </motion.div>

        {/* ==================== BLOB 3 (Center-Mid Stabilizer) ==================== */}
        <motion.div
          style={{
            x: reducedMotion ? "45vw" : x3,
            y: reducedMotion ? "40vh" : y3,
            scale: s3,
            opacity: opacity3,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] size-[42rem] transition-opacity duration-1000 ease-out animate-gpu"
        >
          <motion.div
            className="w-full h-full rounded-full relative overflow-hidden"
            animate={reducedMotion ? undefined : {
              animation: "wobble-fast 18s infinite ease-in-out"
            }}
          >
            {/* Odyssey State (0) -> Surface-Secondary to Background to transparent */}
            <motion.div
              style={{
                opacity: b3_op0,
                background: "radial-gradient(circle at 50% 50%, var(--surface-secondary) 0%, var(--background) 70%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Chronicle State (1) -> Surface-Tertiary to Surface-Secondary to transparent */}
            <motion.div
              style={{
                opacity: b3_op1,
                background: "radial-gradient(circle at 50% 50%, var(--surface-tertiary) 0%, var(--surface-secondary) 70%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Orbit State (2) -> Surface-Secondary to Default to transparent */}
            <motion.div
              style={{
                opacity: b3_op2,
                background: "radial-gradient(circle at 50% 50%, var(--surface-secondary) 0%, var(--default) 70%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
            {/* Travelogue State (3) -> Background to Surface-Tertiary to transparent */}
            <motion.div
              style={{
                opacity: b3_op3,
                background: "radial-gradient(circle at 50% 50%, var(--background) 0%, var(--surface-tertiary) 70%, transparent 100%)",
              }}
              className="absolute inset-0 w-full h-full rounded-full"
            />
          </motion.div>
        </motion.div>

      </div>
    </motion.div>
  );
}

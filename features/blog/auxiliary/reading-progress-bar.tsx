"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ReadingProgressBar() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef(-1);
  const [progress, setProgress] = useState(0);

  useGSAP(
    () => {
      if (!barRef.current || shouldReduceMotion) return;

      gsap.to(barRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
          onUpdate: (self) => {
            const nextProgress = Math.round(self.progress * 100);
            if (nextProgress === lastProgressRef.current) return;
            lastProgressRef.current = nextProgress;
            setProgress(nextProgress);
          },
        },
      });

      // Subtle pulse/glow effect when scrolling fast
      const glowTo = glowRef.current
        ? gsap.quickTo(glowRef.current, "opacity", { duration: 0.25 })
        : null;
      let wasFast = false;
      gsap.to(glowRef.current, {
        opacity: 1,
        duration: 0.2,
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const velocity = Math.abs(self.getVelocity());
            const isFast = velocity > 500;
            if (isFast === wasFast) return;
            wasFast = isFast;
            glowTo?.(isFast ? 0.8 : 0);
          },
        },
      });
    },
    { dependencies: [shouldReduceMotion] }
  );

  useEffect(() => {
    if (!shouldReduceMotion) return;

    let frame = 0;
    const update = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const next = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
        if (next !== lastProgressRef.current) {
          lastProgressRef.current = next;
          setProgress(next);
        }
        if (barRef.current) {
          barRef.current.style.transform = `scaleX(${next / 100})`;
        }
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [shouldReduceMotion]);

  return (
    <div
      className="bg-default-100/50 pointer-events-none fixed top-0 right-0 left-0 z-[100] h-1 w-full backdrop-blur-sm"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div
        ref={barRef}
        className="bg-accent h-full w-full origin-left"
        style={{
          boxShadow: shouldReduceMotion
            ? undefined
            : "0 0 10px color-mix(in oklab, var(--accent) 50%, transparent)",
          transform: "scaleX(0)",
        }}
      />
      {!shouldReduceMotion ? (
        <div
          ref={glowRef}
          className="from-accent absolute top-0 right-0 h-full w-20 bg-gradient-to-l to-transparent opacity-0 blur-sm"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

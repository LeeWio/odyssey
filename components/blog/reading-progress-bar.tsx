"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!barRef.current) return;

      gsap.to(barRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });

      // Subtle pulse/glow effect when scrolling fast
      gsap.to(glowRef.current, {
        opacity: 1,
        duration: 0.2,
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const velocity = Math.abs(self.getVelocity());
            if (velocity > 500) {
              gsap.to(glowRef.current, { opacity: 0.8, duration: 0.2 });
            } else {
              gsap.to(glowRef.current, { opacity: 0, duration: 0.5 });
            }
          },
        },
      });
    },
    { dependencies: [] }
  );

  return (
    <div className="bg-default-100/50 pointer-events-none fixed top-0 right-0 left-0 z-[100] h-1 w-full backdrop-blur-sm">
      <div
        ref={barRef}
        className="bg-accent h-full w-full origin-left shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
        style={{ transform: "scaleX(0)" }}
      />
      <div
        ref={glowRef}
        className="from-accent absolute top-0 right-0 h-full w-20 bg-gradient-to-l to-transparent opacity-0 blur-sm"
        style={{ right: "calc(100% - var(--scroll-progress, 0%))" }} // Note: We'd need to sync this via GSAP too if we want it perfect
      />
    </div>
  );
}

"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function isInsideNativeScroll(node: HTMLElement) {
  return Boolean(
    node.closest("[data-lenis-prevent], [role='dialog'], [role='listbox'], [data-slot='popover']")
  );
}

/**
 * Homepage wheel smoothing. GSAP's ticker drives Lenis, and Lenis tells
 * ScrollTrigger whenever the scroll position changes. Touch stays native.
 * Lenis disables smoothing when prefers-reduced-motion is set.
 */
export function HomeSmoothScroll() {
  const reducedMotion = useReducedMotionPreference();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      anchors: true,
      lerp: 0.1,
      prevent: isInsideNativeScroll,
      smoothWheel: true,
      syncTouch: false,
      stopInertiaOnNavigate: true,
    });

    const onScroll = () => {
      ScrollTrigger.update();
    };
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", onScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}

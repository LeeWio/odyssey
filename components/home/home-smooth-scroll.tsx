"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Homepage wheel smoothing. GSAP's ticker drives Lenis, and Lenis tells
 * ScrollTrigger whenever the scroll position changes. Touch stays native.
 * Lenis disables smoothing when prefers-reduced-motion is set.
 */
export function HomeSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      anchors: true,
      lerp: 0.1,
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
  }, []);

  return null;
}

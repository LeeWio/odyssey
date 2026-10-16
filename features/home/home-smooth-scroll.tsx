"use client";

import { useEffect } from "react";

function isInsideNativeScroll(node: HTMLElement) {
  return Boolean(
    node.closest("[data-lenis-prevent], [role='dialog'], [role='listbox'], [data-slot='popover']")
  );
}

/**
 * Homepage wheel smoothing. The libraries load after the first paint, then
 * GSAP's ticker drives Lenis and Lenis updates ScrollTrigger. Touch stays
 * native. Lenis disables smoothing when prefers-reduced-motion is set.
 */
export function HomeSmoothScroll() {
  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | null = null;
    const idleWindow = window as Window & {
      cancelIdleCallback?: (handle: number) => void;
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    };

    const start = () => {
      void import("./home-smooth-scroll-runtime").then(({ startHomeSmoothScroll }) => {
        if (cancelled) return;
        stop = startHomeSmoothScroll(isInsideNativeScroll);
      });
    };

    const idleId = idleWindow.requestIdleCallback?.(start, { timeout: 1500 });
    const timeoutId = idleId === undefined ? window.setTimeout(start, 300) : undefined;

    return () => {
      cancelled = true;
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      stop?.();
    };
  }, []);

  return null;
}

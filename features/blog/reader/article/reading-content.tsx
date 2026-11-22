"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { bindReadingMotion } from "./reading-motion";
import {
  READING_OPENING_ATTRIBUTE,
  READING_OPENING_SETTLED,
  restoreReloadPosition,
} from "./reading-opening";

export function ReadingContent({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) restoreReloadPosition(ref.current);
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let dispose: (() => void) | undefined;
    let frame: number;
    let measuredOffset = -1;
    let nearbyImages: HTMLImageElement[] = [];

    const startMotion = () => {
      const opening = root.hasAttribute(READING_OPENING_ATTRIBUTE);
      if (opening && window.scrollY > 0) {
        if (measuredOffset !== window.scrollY) {
          measuredOffset = window.scrollY;
          const height = window.innerHeight;
          nearbyImages = Array.from(root.querySelectorAll("img")).filter((image) => {
            if (image.complete || (image.hasAttribute("width") && image.hasAttribute("height"))) {
              return false;
            }
            const { top, bottom } = image.getBoundingClientRect();
            return top < height && bottom > -2 * height;
          });
        }

        // The existing opening guard releases the viewport if loading takes too long.
        if (nearbyImages.some((image) => !image.complete) || document.fonts?.status === "loading") {
          frame = requestAnimationFrame(startMotion);
          return;
        }
      }
      try {
        dispose = bindReadingMotion(root, opening && getComputedStyle(root).opacity === "0");
      } finally {
        if (opening) root.dispatchEvent(new Event(READING_OPENING_SETTLED));
      }
    };
    frame = requestAnimationFrame(startMotion);
    return () => {
      cancelAnimationFrame(frame);
      dispose?.();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-article-body=""
      suppressHydrationWarning
      className={`${className} motion-safe:data-[reading-opening]:opacity-0 [&_[data-reading-pending]]:opacity-0 [&>script:first-child+*]:mt-0!`}
    >
      {children}
    </div>
  );
}

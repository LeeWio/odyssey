"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { bindReadingMotion } from "./reading-motion";
import {
  READING_OPENING_ATTRIBUTE,
  READING_OPENING_SETTLED,
  restoreReloadPosition,
} from "./reading-opening";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ReadingContent({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const clientSnapshot = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  // Hydrated content still belongs to the opening script, even if it already let the reader through.
  const [clientEntry] = useState(clientSnapshot);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    restoreReloadPosition(root);
    let dispose: (() => void) | undefined;
    let frame: number;
    let measuredOffset = -1;
    let nearbyImages: HTMLImageElement[] = [];

    const startMotion = () => {
      const opening = root.hasAttribute(READING_OPENING_ATTRIBUTE);
      if (!clientEntry && opening && window.scrollY > 0) {
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
        // By this frame the router has applied its scroll position for the new article.
        const revealOpening =
          opening &&
          (!clientEntry || (window.scrollY === 0 && !window.location.hash)) &&
          getComputedStyle(root).opacity === "0";
        dispose = bindReadingMotion(root, revealOpening);
      } finally {
        if (clientEntry) root.removeAttribute(READING_OPENING_ATTRIBUTE);
        else if (opening) root.dispatchEvent(new Event(READING_OPENING_SETTLED));
      }
    };
    frame = requestAnimationFrame(startMotion);
    return () => {
      cancelAnimationFrame(frame);
      dispose?.();
    };
  }, [clientEntry]);

  return (
    <div
      ref={ref}
      data-article-body=""
      data-reading-opening={clientEntry ? "" : undefined}
      suppressHydrationWarning
      className={`${className} motion-safe:data-[reading-opening]:opacity-0 [&_[data-reading-pending]]:opacity-0 [&>script:first-child+*]:mt-0!`}
    >
      {children}
    </div>
  );
}

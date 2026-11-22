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
    const frame = requestAnimationFrame(() => {
      const opening = root.hasAttribute(READING_OPENING_ATTRIBUTE);
      try {
        dispose = bindReadingMotion(root, opening && getComputedStyle(root).opacity === "0");
      } finally {
        if (opening) root.dispatchEvent(new Event(READING_OPENING_SETTLED));
      }
    });
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

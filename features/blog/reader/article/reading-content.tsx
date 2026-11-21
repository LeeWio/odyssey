"use client";

import { animate } from "motion/mini";
import { useEffect, useRef, type ReactNode } from "react";

export function ReadingContent({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    const running = new Set<ReturnType<typeof animate>>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (motion.matches) continue;
          const animation = animate(
            entry.target,
            { transform: ["translateY(8px)", "none"] },
            { duration: 0.32, ease: "easeOut" }
          );
          running.add(animation);
          void animation.then(() => running.delete(animation));
        }
      },
      { rootMargin: "0px 0px 80px" }
    );
    for (const block of root.children) {
      if (block.getBoundingClientRect().top > window.innerHeight + 80) observer.observe(block);
    }
    const stop = () => {
      if (!motion.matches) return;
      for (const animation of running) animation.cancel();
      running.clear();
      observer.disconnect();
    };
    motion.addEventListener("change", stop);
    return () => {
      motion.removeEventListener("change", stop);
      observer.disconnect();
      for (const animation of running) animation.cancel();
    };
  }, []);

  return (
    <div ref={ref} data-article-body="" className={className}>
      {children}
    </div>
  );
}

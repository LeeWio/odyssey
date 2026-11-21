"use client";

import { useEffect, useRef, useState } from "react";

export function useNearViewport<T extends HTMLElement>(rootMargin = "400px") {
  const ref = useRef<T>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    if (!ref.current || isNear) return;
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setIsNear(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setIsNear(true);
      },
      { rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isNear, rootMargin]);

  return { ref, isNear };
}

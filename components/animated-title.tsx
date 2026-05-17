"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

export function AnimatedTitle() {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(
        line1Ref.current,
        {
          y: 100,
          opacity: 0,
          skewY: 7,
        },
        {
          y: 0,
          opacity: 1,
          skewY: 0,
          duration: 1.5,
        }
      ).fromTo(
        line2Ref.current,
        {
          y: 100,
          opacity: 0,
          skewY: 7,
        },
        {
          y: 0,
          opacity: 1,
          skewY: 0,
          duration: 1.5,
        },
        "-=1.2" // Overlap with line 1
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <h1
      ref={containerRef}
      className="text-6xl font-extrabold tracking-tighter sm:text-8xl lg:text-9xl leading-[1.1] overflow-hidden"
    >
      <span ref={line1Ref} className="block will-change-transform opacity-0">
        don&apos;t just do it
      </span>
      <span
        ref={line2Ref}
        className="block italic font-serif mt-2 will-change-transform opacity-0 text-accent"
      >
        do it well
      </span>
    </h1>
  );
}

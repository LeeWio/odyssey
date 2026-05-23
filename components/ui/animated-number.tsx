"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  ease?: string;
  format?: (val: number) => string;
}

export function AnimatedNumber({
  value,
  className,
  duration = 1,
  ease = "power2.out",
  format,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const proxy = useRef({ val: value });
  const containerRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      gsap.to(proxy.current, {
        val: value,
        duration,
        ease,
        onUpdate: () => {
          setDisplayValue(proxy.current.val);
        },
      });
    },
    { dependencies: [value], scope: containerRef }
  );

  return (
    <span ref={containerRef} className={className}>
      {format ? format(displayValue) : Math.round(displayValue)}
    </span>
  );
}

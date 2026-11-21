"use client";

import type { ReactNode } from "react";
import { useNearViewport } from "@/hooks/use-near-viewport";

export function DeferredContent({
  children,
  fallback,
  className,
}: {
  children: ReactNode;
  fallback: ReactNode;
  className?: string;
}) {
  const { ref, isNear } = useNearViewport<HTMLDivElement>();

  return (
    <div ref={ref} className={className}>
      {isNear ? children : fallback}
    </div>
  );
}

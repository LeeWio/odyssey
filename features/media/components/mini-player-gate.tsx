"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { selectIsMiniPlayerOpen } from "@/lib/features/ui";
import { useAppSelector } from "@/lib/hooks";

const MiniPlayer = dynamic(
  () => import("./mini-player").then((mod) => mod.MiniPlayer),
  { ssr: false }
);

/**
 * Keep MiniPlayer off the shared main-layout graph until first open.
 * Latch once opened so Sheet close animations still run.
 */
export function MiniPlayerGate() {
  const isOpen = useAppSelector(selectIsMiniPlayerOpen);
  const [loaded, setLoaded] = useState(false);

  if (isOpen && !loaded) {
    setLoaded(true);
  }

  if (!loaded) return null;
  return <MiniPlayer />;
}

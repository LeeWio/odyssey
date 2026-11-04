"use client";

import { ViewTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useNavigationTransition } from "./navigation-transition";

/**
 * Crossfade main-route changes only. An untyped update — the Suspense reveal
 * that mounts a dynamic sheet or modal the first time — opts out, otherwise
 * the whole page snapshots and flashes once.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  useNavigationTransition();
  const pathname = usePathname();
  // Moments owns its local Motion transitions, including topic query changes.
  const transition = /(?:^|\/)moments\/?$/.test(pathname) ? "none" : "page-fade";

  return (
    <ViewTransition
      default="none"
      enter={transition}
      exit={transition}
      name="page-content"
      share="none"
      update={{ navigation: transition, default: "none" }}
    >
      {children}
    </ViewTransition>
  );
}

"use client";

import { ViewTransition, type ReactNode } from "react";
import { useNavigationTransition } from "./navigation-transition";

/**
 * Crossfade main-route changes only. An untyped update — the Suspense reveal
 * that mounts a dynamic sheet or modal the first time — opts out, otherwise
 * the whole page snapshots and flashes once.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  useNavigationTransition();

  return (
    <ViewTransition
      default="none"
      enter="page-fade"
      exit="page-fade"
      name="page-content"
      share="none"
      update={{ navigation: "page-fade", default: "none" }}
    >
      {children}
    </ViewTransition>
  );
}

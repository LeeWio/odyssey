"use client";

import { ViewTransition, type ReactNode } from "react";

/** One crossfade for every main-route change. The shell stays outside this boundary. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      default="page-fade"
      enter="page-fade"
      exit="page-fade"
      name="page-content"
      share="none"
    >
      {children}
    </ViewTransition>
  );
}

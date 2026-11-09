"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { reportPageView } from "@/lib/analytics/page-view";

/** Sends one page view when the visitor actually lands on a route. */
export function PageViewReporter() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/dashboard")) return;
    reportPageView(pathname);
  }, [pathname]);

  return null;
}

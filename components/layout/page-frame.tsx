import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import { PageContainer } from "./page-container";

export interface PageFrameProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section";
}

/** Shared route-level rhythm. Pages still own their inner content measure. */
export function PageFrame({ as: Component = "div", className, ...props }: PageFrameProps) {
  return (
    <PageContainer
      as={Component}
      className={cn("min-h-[100dvh] pt-28 pb-24 lg:pt-32", className)}
      {...props}
    />
  );
}

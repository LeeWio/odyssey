import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "header";
}

export function PageContainer({ as: Component = "div", className, ...props }: PageContainerProps) {
  return <Component className={cn("w-full min-w-0 px-4 md:px-6 xl:px-8", className)} {...props} />;
}

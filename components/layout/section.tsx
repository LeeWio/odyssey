import { cn } from "@/lib/utils";

import { PageContainer, type PageContainerProps } from "./page-container";

export function Section({ className, ...props }: Omit<PageContainerProps, "as">) {
  return (
    <PageContainer
      as="section"
      className={cn("@container/home-section scroll-mt-24 py-16 md:py-24", className)}
      {...props}
    />
  );
}

import type { Metadata } from "next";

import { PageFrame } from "@/components/layout/page-frame";

export const metadata: Metadata = {
  title: "Engineering Lab",
  description:
    "Live telemetry, active workspace updates, and architectural design logs of Odyssey.",
};

export default function BuildingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PageFrame className="relative z-10 mx-auto max-w-7xl">{children}</PageFrame>;
}

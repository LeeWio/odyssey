import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About | Odyssey",
  description:
    "The person and product behind Odyssey: a living notebook for writing, systems craft, photography, and the connections between them.",
};

export default function AboutLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="relative z-10 min-h-screen w-full">{children}</div>;
}

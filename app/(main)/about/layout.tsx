import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About | Odyssey",
  description:
    "A short page of defaults: taste, solitude, play, and the stack behind Odyssey. Not a resume.",
};

export default function AboutLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="relative z-10 min-h-screen w-full">{children}</div>;
}

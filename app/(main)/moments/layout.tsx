import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moments | Odyssey",
  description: "Short field notes, captured fragments, and everyday design/architectural notices.",
};

export default function MomentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="relative z-10 min-h-screen w-full">{children}</div>;
}

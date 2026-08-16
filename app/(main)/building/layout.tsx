import type { Metadata } from "next";

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
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 md:py-20 lg:py-24">
      {children}
    </section>
  );
}

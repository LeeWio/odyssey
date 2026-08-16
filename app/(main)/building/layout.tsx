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
    <div className="relative min-h-[100dvh] w-full overflow-hidden">
      {/* Premium ambient decorative blurred background circles */}
      <span
        aria-hidden="true"
        className="bg-accent/5 pointer-events-none absolute -top-40 -left-20 z-0 size-[45rem] rounded-full blur-3xl"
      />
      <span
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute top-1/2 -right-40 z-0 size-[35rem] rounded-full blur-3xl"
      />

      {/* Main container with structured content boundaries */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 md:py-20 lg:py-24">
        {children}
      </div>
    </div>
  );
}

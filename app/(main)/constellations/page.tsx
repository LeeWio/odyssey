"use client";

import dynamic from "next/dynamic";

const UniverseView = dynamic(
  () => import("@/components/constellation").then((mod) => mod.UniverseView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="animate-pulse text-xs tracking-widest text-white/20 uppercase">
          Initializing Universe1...
        </div>
      </div>
    ),
  }
);

export default function ConstellationsPage() {
  return (
    <div className="h-[100dvh] w-full bg-black">
      <UniverseView />
    </div>
  );
}

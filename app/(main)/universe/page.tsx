"use client";

import { createPageReveal } from "@/lib/motion";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Tabs } from "@heroui/react";
import { MotionChip, MotionTypography } from "@/components/ui";
import dynamic from "next/dynamic";
import { PageFrame } from "@/components/layout/page-frame";

const UniverseView = dynamic(
  () => import("@/features/constellation").then((mod) => mod.UniverseView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[80dvh] w-full items-center justify-center rounded-3xl bg-black">
        <div className="animate-pulse text-xs tracking-widest text-white/30 uppercase">
          星图还在展开…
        </div>
      </div>
    ),
  }
);

const GalleryPage = dynamic(() => import("@/features/gallery").then((mod) => mod.GalleryPage), {
  ssr: false,
});

const FriendLinksPage = dynamic(
  () => import("@/features/friend-links").then((mod) => mod.FriendLinksPage),
  { ssr: false }
);

export default function UniversePage() {
  const shouldReduceMotion = useReducedMotion() ?? false;

  const { reveal } = createPageReveal(shouldReduceMotion);
  const [activeTab, setActiveTab] = useState<string>("mesh");

  return (
    <PageFrame className="bg-black text-white">
      <div className="w-full">
        <header className="max-w-xl">
          <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
            星图
          </MotionChip>
          <MotionTypography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-white"
            {...reveal(0.12)}
          >
            文章连成的图
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body"
            className="mt-4 max-w-md leading-relaxed text-balance text-zinc-400"
            {...reveal(0.2, 12)}
          >
            点一个点，去那篇文章。照片和隔壁的站点在旁边两格。
          </MotionTypography>
        </header>

        {/* High-Aesthetic Dark Theme Tabs Bar */}
        <div className="mt-10">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            <Tabs.ListContainer className="bg-transparent p-0">
              <Tabs.List aria-label="星图里的几块" className="gap-6 sm:gap-8">
                <Tabs.Tab
                  id="mesh"
                  className="h-12 px-1 text-sm font-medium text-zinc-400 data-[selected=true]:text-white"
                >
                  星图
                  <Tabs.Indicator className="bg-accent" />
                </Tabs.Tab>
                <Tabs.Tab
                  id="atmosphere"
                  className="h-12 px-1 text-sm font-medium text-zinc-400 data-[selected=true]:text-white"
                >
                  路上的光
                  <Tabs.Indicator className="bg-accent" />
                </Tabs.Tab>
                <Tabs.Tab
                  id="relations"
                  className="h-12 px-1 text-sm font-medium text-zinc-400 data-[selected=true]:text-white"
                >
                  隔壁
                  <Tabs.Indicator className="bg-accent" />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Panel 1: 3D Constellations Network Mesh */}
            <Tabs.Panel id="mesh" className="mt-10 outline-none">
              <motion.div
                className="relative overflow-hidden rounded-3xl border border-zinc-800 shadow-2xl"
                {...reveal(0.05, 10)}
              >
                <div className="h-[78vh] min-h-[32rem] w-full bg-neutral-950">
                  <UniverseView />
                </div>
              </motion.div>
            </Tabs.Panel>

            {/* Panel 2: Atmosphere Studies (Gallery) */}
            <Tabs.Panel id="atmosphere" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)} className="text-zinc-100">
                <GalleryPage compact />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 3: External Relations Map (Friend Links) */}
            <Tabs.Panel id="relations" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)} className="text-zinc-100">
                <FriendLinksPage compact />
              </motion.div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </PageFrame>
  );
}

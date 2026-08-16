"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Tabs, Card, Chip, Skeleton, Typography } from "@heroui/react";
import { MotionCard, MotionChip, MotionTypography } from "@/components/ui";
import { useMounted } from "@mantine/hooks";
import dynamic from "next/dynamic";

// Modular feature views
import { GalleryPage } from "@/features/gallery";
import { FriendLinksPage } from "@/features/friend-links";

// Dynamically import the heavy 3D WebGL Constellation view
const UniverseView = dynamic(
  () => import("@/components/constellation").then((mod) => mod.UniverseView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[80dvh] w-full items-center justify-center rounded-3xl bg-black">
        <div className="animate-pulse text-xs tracking-widest text-white/30 uppercase">
          Initializing 3D Constellation Mesh...
        </div>
      </div>
    ),
  }
);

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function UniversePage() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const mounted = useMounted();
  const [activeTab, setActiveTab] = useState<string>("mesh");

  const reveal = (delay = 0, distance = 18) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: shouldReduceMotion ? 0 : 0.7, delay, ease: easeOut },
  });

  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-black px-6 pt-28 pb-24 text-white sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-6xl space-y-12">
          <Skeleton className="h-6 w-32 rounded-full bg-zinc-800" />
          <Skeleton className="h-16 w-3/4 rounded-2xl bg-zinc-800" />
          <Skeleton className="h-6 w-1/2 rounded-lg bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-black px-6 pt-28 pb-24 text-white sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        {/* Dark Mode Cosmic Header */}
        <header className="flex flex-col items-center text-center">
          <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
            The Universe
          </MotionChip>
          <MotionTypography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.055em] text-white"
            {...reveal(0.12)}
          >
            Cosmic Connections.
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body"
            className="mt-4 max-w-xl leading-relaxed text-balance text-zinc-400"
            {...reveal(0.2, 12)}
          >
            A cohesive canvas of intellectual constellations, atmospheric film studies, and the web
            of external friendships that bridge different digital worlds.
          </MotionTypography>
        </header>

        {/* High-Aesthetic Dark Theme Tabs Bar */}
        <div className="mt-12 flex justify-center">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="secondary"
            className="w-full max-w-4xl"
          >
            <Tabs.ListContainer className="border-b border-zinc-800 bg-transparent p-0">
              <Tabs.List aria-label="Universe sections" className="gap-6 sm:gap-8">
                <Tabs.Tab
                  id="mesh"
                  className="h-12 px-1 text-sm font-medium text-zinc-400 data-[selected=true]:text-white"
                >
                  3D Constellations Mesh
                  <Tabs.Indicator className="bg-accent" />
                </Tabs.Tab>
                <Tabs.Tab
                  id="atmosphere"
                  className="h-12 px-1 text-sm font-medium text-zinc-400 data-[selected=true]:text-white"
                >
                  Atmosphere Studies
                  <Tabs.Indicator className="bg-accent" />
                </Tabs.Tab>
                <Tabs.Tab
                  id="relations"
                  className="h-12 px-1 text-sm font-medium text-zinc-400 data-[selected=true]:text-white"
                >
                  External Relations
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
                <div className="h-[75dvh] w-full bg-neutral-950">
                  <UniverseView />
                </div>
              </motion.div>
            </Tabs.Panel>

            {/* Panel 2: Atmosphere Studies (Gallery) */}
            <Tabs.Panel id="atmosphere" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)} className="text-zinc-100">
                <GalleryPage />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 3: External Relations Map (Friend Links) */}
            <Tabs.Panel id="relations" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)} className="text-zinc-100">
                <FriendLinksPage />
              </motion.div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

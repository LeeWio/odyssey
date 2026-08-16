"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Tabs, Card, Chip, Skeleton, Typography } from "@heroui/react";
import { MotionCard, MotionChip, MotionTypography } from "@/components/ui";
import { useMounted } from "@mantine/hooks";

// Sub-components from our modular features
import { AboutPage } from "@/features/about";
import { UsesPage } from "@/features/uses";
import { RecruiterPage } from "@/features/recruiter";
import GuestbookBoard from "@/components/corners/guestbook-board";

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function PersonaPage() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const mounted = useMounted();
  const [activeTab, setActiveTab] = useState<string>("about");

  const reveal = (delay = 0, distance = 18) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: shouldReduceMotion ? 0 : 0.7, delay, ease: easeOut },
  });

  if (!mounted) {
    return (
      <div className="bg-background min-h-screen w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-6xl space-y-12">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-6 w-1/2 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        {/* Cinematic Header matching Homepage & Chronicle */}
        <header className="flex flex-col items-center text-center">
          <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
            Digital Persona
          </MotionChip>
          <MotionTypography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.055em]"
            {...reveal(0.12)}
          >
            The Architect behind the work.
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body"
            className="mt-4 max-w-xl leading-relaxed text-balance"
            {...reveal(0.2, 12)}
          >
            A technical breakdown of personal philosophies, physical and compiler setups,
            professional career radar, and visitor reflections.
          </MotionTypography>
        </header>

        {/* High-Aesthetic Tabs Bar */}
        <div className="mt-12 flex justify-center">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="secondary"
            className="w-full max-w-4xl"
          >
            <Tabs.ListContainer className="border-default-100 border-b bg-transparent p-0">
              <Tabs.List aria-label="Persona sections" className="gap-6 sm:gap-8">
                <Tabs.Tab id="about" className="h-12 px-1 text-sm font-medium">
                  About Me
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="setup" className="h-12 px-1 text-sm font-medium">
                  The Setup (Uses)
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="career" className="h-12 px-1 text-sm font-medium">
                  Career Radar (HR)
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="guestbook" className="h-12 px-1 text-sm font-medium">
                  Guestbook Logs
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Panel 1: About Me (Identity & Philosophy) */}
            <Tabs.Panel id="about" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <AboutPage />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 2: The Setup (Hardware & Configurations) */}
            <Tabs.Panel id="setup" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <UsesPage />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 3: Career Radar (Professional presentation) */}
            <Tabs.Panel id="career" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <RecruiterPage />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 4: Guestbook Signings */}
            <Tabs.Panel id="guestbook" className="mt-10 outline-none">
              <motion.div className="space-y-12" {...reveal(0.05, 10)}>
                <div>
                  <Typography type="h3" weight="bold" className="text-center tracking-tight">
                    Guestbook Notes
                  </Typography>
                  <Typography color="muted" type="body-sm" className="mt-1 text-center">
                    Leave a signature or share thoughts about the technical constellations.
                  </Typography>
                </div>
                <div className="w-full overflow-hidden">
                  <GuestbookBoard />
                </div>
              </motion.div>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

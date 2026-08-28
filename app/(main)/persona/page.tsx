"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Tabs, Typography } from "@heroui/react";
import { MotionChip, MotionTypography } from "@/components/ui";

// Sub-components from our modular features
import { AboutPage } from "@/features/about";
import { UsesPage } from "@/features/uses";
import { RecruiterPage } from "@/features/recruiter";
import GuestbookBoard from "@/components/corners/guestbook-board";

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function PersonaPage() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [activeTab, setActiveTab] = useState<string>("about");

  const reveal = (delay = 0, distance = 18) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.65, delay, ease: easeOut },
  });

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        {/* Cinematic Header matching Homepage & Chronicle */}
        <header className="flex flex-col items-center text-center">
          <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
            Persona
          </MotionChip>
          <MotionTypography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.055em]"
            {...reveal(0.12)}
          >
            The person behind the work.
          </MotionTypography>
          <MotionTypography
            color="muted"
            type="body"
            className="mt-4 max-w-xl leading-relaxed text-balance"
            {...reveal(0.2, 12)}
          >
            A few principles, tools, and notes on the work in progress.
          </MotionTypography>
        </header>

        {/* High-Aesthetic Tabs Bar */}
        <div className="mt-12 flex justify-center">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full max-w-4xl"
          >
            <Tabs.ListContainer className="border-default-100 border-b bg-transparent p-0">
              <Tabs.List aria-label="Persona sections" className="gap-6 sm:gap-8">
                <Tabs.Tab id="about" className="h-12 px-1 text-sm font-medium">
                  About
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="setup" className="h-12 px-1 text-sm font-medium">
                  Tools
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="career" className="h-12 px-1 text-sm font-medium">
                  Work
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="guestbook" className="h-12 px-1 text-sm font-medium">
                  Guestbook
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Panel 1: About Me (Identity & Philosophy) */}
            <Tabs.Panel id="about" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <AboutPage compact />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 2: The Setup (Hardware & Configurations) */}
            <Tabs.Panel id="setup" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <UsesPage compact />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 3: Career Radar (Professional presentation) */}
            <Tabs.Panel id="career" className="mt-10 outline-none">
              <motion.div {...reveal(0.05, 10)}>
                <RecruiterPage compact />
              </motion.div>
            </Tabs.Panel>

            {/* Panel 4: Guestbook Signings */}
            <Tabs.Panel id="guestbook" className="mt-10 outline-none">
              <motion.div className="space-y-12" {...reveal(0.05, 10)}>
                <div>
                  <Typography type="h3" weight="bold" className="text-center tracking-tight">
                    A note from you.
                  </Typography>
                  <Typography color="muted" type="body-sm" className="mt-1 text-center">
                    Small notes from visitors who have spent time here.
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

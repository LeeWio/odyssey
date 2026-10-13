"use client";

import { createPageReveal } from "@/lib/motion";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import { Skeleton, Tabs, Typography } from "@heroui/react";
import { MotionChip, MotionTypography } from "@/components/ui";
import { PageFrame } from "@/components/layout/page-frame";
import { useTranslations } from "next-intl";

// Sub-components from our modular features
import { AboutPage } from "@/features/about";
import { UsesPage } from "@/features/uses";
import { RecruiterPage } from "@/features/recruiter";

const GuestbookBoard = dynamic(() => import("@/components/corners/guestbook-board"), {
  ssr: false,
  loading: () => <Skeleton className="min-h-64 w-full rounded-3xl" />,
});

export default function PersonaPage() {
  const t = useTranslations("Home.persona");
  const shouldReduceMotion = useReducedMotion() ?? false;

  const { reveal } = createPageReveal(shouldReduceMotion);
  const [activeTab, setActiveTab] = useState<string>("about");

  return (
    <PageFrame className="bg-background">
      <div className="w-full">
        <header className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
              {t("eyebrow")}
            </MotionChip>
            <MotionTypography
              type="h1"
              weight="bold"
              className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em]"
              {...reveal(0.12)}
            >
              {t("title")}
            </MotionTypography>
            <MotionTypography
              color="muted"
              type="body"
              className="mt-4 max-w-md leading-relaxed text-balance"
              {...reveal(0.2, 12)}
            >
              {t("description")}
            </MotionTypography>
          </div>
        </header>

        <div className="mt-10">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            <Tabs.ListContainer className="bg-transparent p-0">
              <Tabs.List aria-label={t("sections")} className="gap-6 sm:gap-8">
                <Tabs.Tab id="about" className="h-12 px-1 text-sm font-medium">
                  {t("about")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="setup" className="h-12 px-1 text-sm font-medium">
                  {t("tools")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="career" className="h-12 px-1 text-sm font-medium">
                  {t("work")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="guestbook" className="h-12 px-1 text-sm font-medium">
                  {t("guestbook")}
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
                  <Typography type="h3" weight="bold" className="tracking-tight">
                    {t("guestbookTitle")}
                  </Typography>
                  <Typography color="muted" type="body-sm" className="mt-1">
                    {t("guestbookLine")}
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
    </PageFrame>
  );
}

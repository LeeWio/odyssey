"use client";

import { createPageReveal, pageEaseOut } from "@/lib/motion";

import { useMemo, useState } from "react";
import { Button, Chip, Tabs, Typography } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { motion, useReducedMotion } from "motion/react";
import { useNow, useTranslations } from "next-intl";

import { MomentCard, MomentCardSkeleton } from "@/features/moment/components/card";
import { useMomentFeed } from "@/features/moment/hooks/use-moment-feed";

const timeframes = [
  { id: "all", labelKey: "allNotes" },
  { id: "today", labelKey: "today" },
  { id: "yesterday", labelKey: "yesterday" },
  { id: "week", labelKey: "thisWeek" },
  { id: "month", labelKey: "thisMonth" },
] as const;

type Timeframe = (typeof timeframes)[number]["id"];

function getMomentTimestamp(value: string) {
  const date =
    value.includes("T") && !value.endsWith("Z") && !value.includes("+") ? `${value}Z` : value;

  return new Date(date).getTime();
}

export default function MomentsPage() {
  const t = useTranslations("Moments");
  const now = useNow();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [activeTab, setActiveTab] = useState<Timeframe>("all");
  const { moments, isLoading, isError, isFetchingMore, hasMore, loadMore, refetch } =
    useMomentFeed(12);

  const { revealInView } = createPageReveal(shouldReduceMotion);

  const filteredMoments = useMemo(() => {
    if (activeTab === "all") return moments;

    const nowMs = now.getTime();
    const day = 24 * 60 * 60 * 1000;

    return moments.filter((moment) => {
      const timestamp = getMomentTimestamp(moment.createdAt);
      if (!Number.isFinite(timestamp)) return false;

      const age = nowMs - timestamp;

      switch (activeTab) {
        case "today":
          return age < day;
        case "yesterday":
          return age >= day && age < day * 2;
        case "week":
          return age < day * 7;
        case "month":
          return age < day * 30;
        default:
          return true;
      }
    });
  }, [activeTab, moments, now]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex flex-col items-center text-center">
        <motion.div {...revealInView(0, 10)}>
          <Chip color="default" size="sm" variant="secondary">
            {t("eyebrow")}
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] tracking-[-0.05em]"
          >
            {t("headline")}
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className="mt-3 max-w-xl text-balance">
            {t("headlineDescription")}
          </Typography>
        </motion.div>
      </header>

      <motion.div className="mx-auto mt-12 w-full max-w-2xl" {...revealInView(0.18, 16)}>
        <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as Timeframe)}>
          <Tabs.ListContainer>
            <Tabs.List aria-label={t("filterByDate")}>
              {timeframes.map((timeframe) => (
                <Tabs.Tab key={timeframe.id} id={timeframe.id}>
                  {t(timeframe.labelKey)}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </motion.div>

      <section aria-label={t("feed")} className="mx-auto mt-12 w-full max-w-3xl">
        {isLoading ? (
          <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
            {Array.from({ length: 3 }, (_, index) => (
              <MomentCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState className="bg-surface-secondary rounded-2xl">
            <EmptyState.Header>
              <EmptyState.Title>{t("unavailable")}</EmptyState.Title>
              <EmptyState.Description className="max-w-sm text-pretty">
                {t("unavailableHint")}
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button size="sm" variant="secondary" onPress={() => refetch()}>
                {t("tryAgain")}
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : filteredMoments.length === 0 ? (
          <EmptyState className="bg-surface-secondary rounded-2xl">
            <EmptyState.Header>
              <EmptyState.Title>{t("emptyWindow")}</EmptyState.Title>
              <EmptyState.Description className="max-w-sm text-pretty">
                {t("emptyWindowHint")}
              </EmptyState.Description>
            </EmptyState.Header>
            {activeTab !== "all" ? (
              <EmptyState.Content>
                <Button size="sm" variant="secondary" onPress={() => setActiveTab("all")}>
                  {t("showAll")}
                </Button>
              </EmptyState.Content>
            ) : null}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredMoments.map((moment, index) => (
              <motion.div
                key={moment.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.65,
                  delay: Math.min(index, 5) * 0.05,
                  ease: pageEaseOut,
                }}
              >
                <MomentCard moment={moment} />
              </motion.div>
            ))}

            {hasMore ? (
              <div className="flex justify-center pt-2">
                <Button isPending={isFetchingMore} size="sm" variant="secondary" onPress={loadMore}>
                  {t("loadMoreNotes")}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

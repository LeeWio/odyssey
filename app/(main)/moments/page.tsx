"use client";

import { useMemo, useState } from "react";
import { Button, Chip, Tabs, Typography } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { motion, useReducedMotion } from "motion/react";
import { useNow } from "next-intl";

import { MomentCard, MomentCardSkeleton } from "@/features/moment";
import { useMomentFeed } from "@/features/moment/hooks/use-moment-feed";

const easeOut = [0.22, 1, 0.36, 1] as const;

const timeframes = [
  { id: "all", label: "All notes" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
] as const;

type Timeframe = (typeof timeframes)[number]["id"];

function getMomentTimestamp(value: string) {
  const date =
    value.includes("T") && !value.endsWith("Z") && !value.includes("+") ? `${value}Z` : value;

  return new Date(date).getTime();
}

export default function MomentsPage() {
  const now = useNow();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [activeTab, setActiveTab] = useState<Timeframe>("all");
  const { moments, isLoading, isError, isFetchingMore, hasMore, loadMore, refetch } =
    useMomentFeed(12);

  const revealInView = (delay = 0, distance = 20) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.65,
      delay,
      ease: easeOut,
    },
  });

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
    <main className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex flex-col items-center text-center">
        <motion.div {...revealInView(0, 10)}>
          <Chip color="default" size="sm" variant="secondary">
            Moments
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] tracking-[-0.05em]"
          >
            This &amp; That
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className="mt-3 max-w-xl text-balance">
            Small observations, passing fascinations, and things worth keeping close.
          </Typography>
        </motion.div>
      </header>

      <motion.div className="mx-auto mt-12 w-full max-w-2xl" {...revealInView(0.18, 16)}>
        <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as Timeframe)}>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Filter moments by date">
              {timeframes.map((timeframe) => (
                <Tabs.Tab key={timeframe.id} id={timeframe.id}>
                  {timeframe.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </motion.div>

      <section aria-label="Moments feed" className="mx-auto mt-12 w-full max-w-3xl">
        {isLoading ? (
          <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
            {Array.from({ length: 3 }, (_, index) => (
              <MomentCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState className="bg-surface-secondary rounded-2xl">
            <EmptyState.Header>
              <EmptyState.Title>Moments are taking a moment</EmptyState.Title>
              <EmptyState.Description className="max-w-sm text-pretty">
                The feed could not be loaded right now. Please try again.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button size="sm" variant="secondary" onPress={() => refetch()}>
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : filteredMoments.length === 0 ? (
          <EmptyState className="bg-surface-secondary rounded-2xl">
            <EmptyState.Header>
              <EmptyState.Title>Nothing in this stretch of time</EmptyState.Title>
              <EmptyState.Description className="max-w-sm text-pretty">
                Try a wider window to see more notes from the archive.
              </EmptyState.Description>
            </EmptyState.Header>
            {activeTab !== "all" ? (
              <EmptyState.Content>
                <Button size="sm" variant="secondary" onPress={() => setActiveTab("all")}>
                  Show all notes
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
                  ease: easeOut,
                }}
              >
                <MomentCard moment={moment} />
              </motion.div>
            ))}

            {hasMore ? (
              <div className="flex justify-center pt-2">
                <Button isPending={isFetchingMore} size="sm" variant="secondary" onPress={loadMore}>
                  Load more notes
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

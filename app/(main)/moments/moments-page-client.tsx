"use client";

import { pageEaseOut } from "@/lib/motion";

import { Button, Card, Typography } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { MomentCard, MomentCardSkeleton } from "@/features/moment/components/card";
import { MomentCadenceCard } from "@/features/moment/components/cadence-card";
import { MomentTopicWidget } from "@/features/moment/components/topic-widget";
import { useMomentFeed } from "@/features/moment/hooks/use-moment-feed";
import { useMomentBookmarks } from "@/features/moment/hooks/use-moment-bookmarks";
import { PageFrame } from "@/components/layout/page-frame";
import type { PublicMomentsInitialData } from "@/lib/features/moment/public-moments";
import { useGetLikedMomentIdsQuery } from "@/lib/features/moment";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";

function DeskRow({
  count,
  current = false,
  label,
  onPress,
}: {
  count?: number | null;
  current?: boolean;
  label: string;
  onPress?: () => void;
}) {
  const locale = useLocale();

  return (
    <Card
      variant={current ? "secondary" : "transparent"}
      className="w-full"
      {...(onPress ? { onPress } : {})}
    >
      <Card.Header className="flex-row items-baseline justify-between gap-3">
        <Card.Title className="text-base">{label}</Card.Title>
        {count == null ? null : (
          <Typography color="muted" type="body-sm" className="tabular-nums">
            {count.toLocaleString(locale)}
          </Typography>
        )}
      </Card.Header>
    </Card>
  );
}

export default function MomentsPage({ initialData }: { initialData: PublicMomentsInitialData }) {
  const t = useTranslations("Moments");
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || undefined;
  const shouldReduceMotion = useReducedMotion() ?? false;
  const bookmarks = useMomentBookmarks();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { moments, isLoading, isError, isFetchingMore, hasMore, loadMore, refetch } = useMomentFeed(
    12,
    initialData.page
  );
  const visibleMoments = topic
    ? moments.filter((moment) => moment.topics.some((item) => item.slug === topic))
    : moments;

  const selectTopic = (slug?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("topic", slug);
    else params.delete("topic");
    const query = params.toString();
    router.replace(query ? `/moments?${query}` : "/moments", { scroll: false });
  };
  const likedMomentIdsQuery = useGetLikedMomentIdsQuery(
    moments.map((moment) => moment.id),
    { skip: !isAuthenticated || moments.length === 0 }
  );
  const knownLikedMomentIds = isAuthenticated ? (likedMomentIdsQuery.data ?? []) : undefined;

  return (
    <PageFrame className="bg-background">
      <div className="grid w-full items-start gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <nav aria-label={t("feed")} className="flex flex-col gap-2 lg:sticky lg:top-24">
          <MomentCadenceCard
            label={t("cadence")}
            labels={{ day: t("cadenceDay"), month: t("cadenceMonth"), year: t("cadenceYear") }}
            retryLabel={t("tryAgain")}
            unavailable={t("cadenceUnavailable")}
            initialData={initialData.cadence}
          />
          <MomentTopicWidget moments={moments} selected={topic} onSelect={selectTopic} />
          <DeskRow label={t("liked")} onPress={() => router.push("/moments/liked")} />
          <DeskRow
            count={bookmarks.ids.length}
            label={t("saved")}
            onPress={() => router.push("/moments/saved")}
          />
        </nav>

        <section aria-label={t("feed")} className="w-full">
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
          ) : visibleMoments.length === 0 ? (
            <EmptyState className="bg-surface-secondary rounded-2xl">
              <EmptyState.Header>
                <EmptyState.Title>{t("empty")}</EmptyState.Title>
              </EmptyState.Header>
            </EmptyState>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
              {visibleMoments.map((moment, index) => (
                <motion.div
                  key={moment.id}
                  className="mb-4 break-inside-avoid"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.65,
                    delay: Math.min(index, 5) * 0.05,
                    ease: pageEaseOut,
                  }}
                >
                  <MomentCard moment={moment} knownLikedMomentIds={knownLikedMomentIds} />
                </motion.div>
              ))}

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <Button
                    isPending={isFetchingMore}
                    size="sm"
                    variant="secondary"
                    onPress={loadMore}
                  >
                    {t("loadMoreNotes")}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  );
}

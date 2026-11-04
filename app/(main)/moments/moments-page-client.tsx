"use client";

import { Button } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { memo, useCallback, useEffect, useRef } from "react";

import { MomentCadenceCard } from "@/features/moment/components/cadence-card";
import { MomentTopicWidget } from "@/features/moment/components/topic-widget";
import { MomentFeedLayout } from "@/features/moment/components/feed-layout";
import { MomentFeedList } from "@/features/moment/components/feed-list";
import { MomentFeedLoading } from "@/features/moment/components/feed-loading";
import { MomentsPagination } from "@/features/moment/components/moments-pagination";
import { MomentMotionProvider, MomentState } from "@/features/moment/components/feed-motion";
import { useMomentFeed } from "@/features/moment/hooks/use-moment-feed";
import { useMomentAnchor } from "@/features/moment/hooks/use-moment-anchor";
import { PageFrame } from "@/components/layout/page-frame";
import type { PublicMomentsInitialData } from "@/lib/features/moment/public-moments";
import { useGetLikedMomentIdsQuery } from "@/lib/features/moment";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";
import { clampPageToTotal, parsePageParam } from "@/lib/utils/pagination";

export default function MomentsPage({ initialData }: { initialData: PublicMomentsInitialData }) {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || undefined;
  const page = parsePageParam(searchParams.get("page"));
  return <MomentsContent initialData={initialData} page={page} topic={topic} />;
}

// URL-only presentation changes should not rerender data hooks, the sidebar or cards.
const MomentsContent = memo(function MomentsContent({
  initialData,
  page,
  topic,
}: {
  initialData: PublicMomentsInitialData;
  page: number;
  topic?: string;
}) {
  const t = useTranslations("Moments");
  const feedRef = useRef<HTMLElement>(null);
  const previousDisplay = useRef<string | null>(null);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const {
    moments,
    isLoading,
    isError,
    isRefreshing,
    isRefreshError,
    displayKey,
    totalPages,
    resolvedTotalPages,
    isFetchingPage,
    displayedPage,
    fetchPage,
    removeMoment,
    refetch,
  } = useMomentFeed(12, initialData.page, topic, undefined, { retainPreviousData: true }, page);
  const visibleMoments = moments;

  const changePage = useCallback((nextPage: number, keepAnchor = false) => {
    if (!Number.isSafeInteger(nextPage) || nextPage < 1) return;
    const params = new URLSearchParams(window.location.search);
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    const query = params.toString();
    const hash = keepAnchor ? window.location.hash : "";
    const url = `${query ? `/moments?${query}` : "/moments"}${hash}`;
    if (keepAnchor) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }, []);
  const resolveAnchor = useCallback((nextPage: number) => changePage(nextPage, true), [changePage]);

  const anchor = useMomentAnchor({
    moments,
    page: displayedPage,
    totalPages,
    isLoading: isLoading || isRefreshing,
    isError: isError || isRefreshError,
    isFetchingPage,
    fetchPage,
    onPageChange: resolveAnchor,
    filterKey: topic,
  });

  useEffect(() => {
    if (resolvedTotalPages === undefined) return;
    const normalizedPage = clampPageToTotal(page, resolvedTotalPages);
    const url = new URL(window.location.href);
    if (normalizedPage === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(normalizedPage));
    if (url.search !== window.location.search) {
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [page, resolvedTotalPages, topic]);

  useEffect(() => {
    if (isLoading || isRefreshing || isError || isRefreshError || displayedPage !== page) return;
    const changed = previousDisplay.current !== null && previousDisplay.current !== displayKey;
    previousDisplay.current = displayKey;
    if (changed && !window.location.hash) {
      feedRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
      feedRef.current?.focus({ preventScroll: true });
    }
  }, [displayKey, displayedPage, page, isLoading, isRefreshing, isError, isRefreshError]);

  const selectTopic = (slug?: string) => {
    const params = new URLSearchParams(window.location.search);
    if (slug) params.set("topic", slug);
    else params.delete("topic");
    params.delete("page");
    const query = params.toString();
    window.history.pushState(null, "", query ? `/moments?${query}` : "/moments");
  };
  const likedMomentIdsQuery = useGetLikedMomentIdsQuery(
    moments.map((moment) => moment.id),
    { skip: !isAuthenticated || moments.length === 0 }
  );
  const knownLikedMomentIds = isAuthenticated ? (likedMomentIdsQuery.data ?? []) : undefined;

  return (
    <MomentMotionProvider>
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
            <MomentTopicWidget selected={topic} onSelect={selectTopic} />
          </nav>

          <section
            ref={feedRef}
            aria-label={t("feed")}
            className="w-full min-w-0 scroll-mt-28 outline-none"
            tabIndex={-1}
          >
            <MomentFeedLayout busy={isLoading || isRefreshing}>
              {!isLoading && !isError && !["dismissed", "found"].includes(anchor.status) ? (
                <MomentState>
                  <div className="border-separator mb-5 flex flex-wrap items-center gap-3 border-b pb-4">
                    <p className="text-muted min-w-0 flex-1 text-sm" role="status">
                      {t(`anchor.${anchor.status}`)}
                    </p>
                    {anchor.status === "error" || anchor.status === "paused" ? (
                      <Button size="sm" variant="secondary" onPress={anchor.retry}>
                        <Icon
                          aria-hidden="true"
                          icon={anchor.status === "error" ? "lucide:rotate-cw" : "lucide:search"}
                        />
                        {t(anchor.status === "error" ? "tryAgain" : "anchor.continue")}
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onPress={anchor.dismiss}>
                      <Icon aria-hidden="true" icon="lucide:x" />
                      {t(anchor.status === "searching" ? "anchor.stop" : "anchor.dismiss")}
                    </Button>
                  </div>
                </MomentState>
              ) : null}
              {isRefreshError ? (
                <MomentState>
                  <div
                    className="border-separator mb-5 flex flex-wrap items-center gap-3 border-b pb-4"
                    role="status"
                  >
                    <p className="text-muted min-w-0 flex-1 text-sm">{t("unavailableHint")}</p>
                    <Button size="sm" variant="secondary" onPress={() => refetch()}>
                      {t("tryAgain")}
                    </Button>
                  </div>
                </MomentState>
              ) : null}
              {isLoading ? (
                <MomentFeedLoading label={t("loading")} />
              ) : isError ? (
                <MomentState>
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
                </MomentState>
              ) : (
                <>
                  <MomentFeedList
                    key={displayKey}
                    moments={visibleMoments}
                    knownLikedMomentIds={knownLikedMomentIds}
                    targetId={anchor.status === "found" ? anchor.targetId : null}
                    onDeleted={removeMoment}
                  />

                  {visibleMoments.length === 0 ? (
                    <MomentState>
                      <EmptyState className="bg-surface-secondary rounded-2xl">
                        <EmptyState.Header>
                          <EmptyState.Title>{t("empty")}</EmptyState.Title>
                        </EmptyState.Header>
                      </EmptyState>
                    </MomentState>
                  ) : null}

                  <MomentsPagination
                    page={displayedPage}
                    pages={totalPages}
                    isDisabled={isFetchingPage || anchor.status === "searching"}
                    onPageChange={(nextPage) => changePage(nextPage)}
                  />
                </>
              )}
            </MomentFeedLayout>
          </section>
        </div>
      </PageFrame>
    </MomentMotionProvider>
  );
});

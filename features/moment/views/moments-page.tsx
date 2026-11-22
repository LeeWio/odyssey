"use client";

import { Button } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { MomentCadenceCard } from "@/features/moment/components/cadence-card";
import { MomentSubscriptionDialog } from "@/features/moment/components/moment-subscription-dialog";
import { MomentTopicWidget } from "@/features/moment/components/topic-widget";
import { MomentFeedLayout } from "@/features/moment/components/feed-layout";
import { MomentFeedList } from "@/features/moment/components/feed-list";
import { MomentFeedLoading } from "@/features/moment/components/feed-loading";
import { MomentsPagination } from "@/features/moment/components/moments-pagination";
import { MomentMotionProvider, MomentState } from "@/features/moment/components/feed-motion";
import { useMomentFeed } from "@/features/moment/hooks/use-moment-feed";
import { useMomentAnchor } from "@/features/moment/hooks/use-moment-anchor";
import { PageFrame } from "@/components/layout/page-frame";
import type { PageResult } from "@/lib/api";
import { useGetLikedMomentIdsQuery, type MomentResponse } from "@/lib/features/moment";
import { selectIsAuthenticated, selectIsAdmin } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";
import { useQueryState } from "@/lib/hooks/use-query-state";
import { clampPageToTotal, parsePageParam } from "@/lib/utils/pagination";

const MomentPublisher = dynamic(
  () =>
    import("@/features/moment/components/publisher/moment-publisher").then(
      (mod) => mod.MomentPublisher
    ),
  { ssr: false }
);

export function MomentsPage({
  initialPage,
  initialTopic,
}: {
  initialPage: PageResult<MomentResponse> | null;
  initialTopic?: string;
}) {
  const { searchParams, updateQuery } = useQueryState({ clientOnly: true });
  const topic = searchParams.get("topic") || undefined;
  const pageParam = searchParams.get("page");
  const page = parsePageParam(pageParam);
  return (
    <MomentsContent
      initialPage={topic === initialTopic ? initialPage : null}
      page={page}
      pageParam={pageParam}
      topic={topic}
      updateQuery={updateQuery}
    />
  );
}

// URL-only presentation changes should not rerender data hooks, the sidebar or cards.
const MomentsContent = memo(function MomentsContent({
  initialPage,
  page,
  pageParam,
  topic,
  updateQuery,
}: {
  initialPage: PageResult<MomentResponse> | null;
  page: number;
  pageParam: string | null;
  topic?: string;
  updateQuery: ReturnType<typeof useQueryState>["updateQuery"];
}) {
  const t = useTranslations("Moments");
  const feedRef = useRef<HTMLElement>(null);
  const previousDisplay = useRef<string | null>(null);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const [editingMoment, setEditingMoment] = useState<MomentResponse | null>(null);
  const editingId = useRef<number | null>(null);
  const editingScroll = useRef({ x: 0, y: 0, page });
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
    updateMoment,
    refetch,
  } = useMomentFeed(12, initialPage, topic, undefined, { retainPreviousData: true }, page);
  const visibleMoments = moments;

  const editMoment = useCallback(
    (moment: MomentResponse) => {
      editingId.current = moment.id;
      editingScroll.current = { x: window.scrollX, y: window.scrollY, page };
      setEditingMoment(moment);
    },
    [page]
  );
  const closeEditor = useCallback(
    (open: boolean) => {
      if (open) return;
      setEditingMoment(null);
      requestAnimationFrame(() => {
        const element = document.getElementById(`moment-${editingId.current}`);
        const card = element?.hasAttribute("inert") ? null : element;
        const trigger = card?.querySelector<HTMLButtonElement>("[data-moment-menu]");
        (trigger ?? card ?? feedRef.current)?.focus({ preventScroll: true });
        if (parsePageParam(pageParam) === editingScroll.current.page) {
          window.scrollTo({
            left: editingScroll.current.x,
            top: editingScroll.current.y,
            behavior: "instant",
          });
        }
      });
    },
    [pageParam]
  );

  const changePage = useCallback(
    (nextPage: number, keepAnchor = false) => {
      if (!Number.isSafeInteger(nextPage) || nextPage < 1) return;
      if (!keepAnchor && nextPage === page) return;
      updateQuery(
        { page: nextPage === 1 ? null : nextPage },
        {
          mode: keepAnchor ? "replace" : "push",
          hash: keepAnchor ? window.location.hash : "",
        }
      );
    },
    [page, updateQuery]
  );
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
    const normalizedParam = normalizedPage === 1 ? null : String(normalizedPage);
    if (pageParam === normalizedParam) return;
    const liveParams = new URLSearchParams(window.location.search);
    if (liveParams.get("page") !== pageParam || (liveParams.get("topic") || undefined) !== topic)
      return;
    updateQuery({ page: normalizedParam }, { mode: "replace", hash: window.location.hash });
  }, [page, pageParam, resolvedTotalPages, topic, updateQuery]);

  useEffect(() => {
    if (isLoading || isRefreshing || isError || isRefreshError || displayedPage !== page) return;
    const changed = previousDisplay.current !== null && previousDisplay.current !== displayKey;
    previousDisplay.current = displayKey;
    const feed = feedRef.current;
    if (changed && feed && !window.location.hash) {
      const { top } = feed.getBoundingClientRect();
      const topInset = Number.parseFloat(getComputedStyle(feed).scrollMarginTop);
      if (top < topInset || top >= window.innerHeight - topInset) {
        feed.scrollIntoView({ behavior: "instant", block: "start" });
      }
      feed.focus({ preventScroll: true });
    }
  }, [displayKey, displayedPage, page, isLoading, isRefreshing, isError, isRefreshError]);

  const selectTopic = useCallback(
    (slug?: string) => {
      updateQuery({ topic: slug || null, page: null }, { mode: "push", hash: "" });
    },
    [updateQuery]
  );
  const likedMomentIdsQuery = useGetLikedMomentIdsQuery(
    moments.map((moment) => moment.id),
    { skip: !isAuthenticated || moments.length === 0 }
  );
  const knownLikedMomentIds = isAuthenticated ? (likedMomentIdsQuery.data ?? []) : undefined;

  return (
    <MomentMotionProvider>
      <PageFrame className="bg-background">
        <div className="grid w-full items-start gap-3 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside aria-label={t("cadence")} className="min-w-0 lg:sticky lg:top-24">
            <MomentCadenceCard
              label={t("cadence")}
              labels={{ day: t("cadenceDay"), month: t("cadenceMonth"), year: t("cadenceYear") }}
              retryLabel={t("tryAgain")}
              unavailable={t("cadenceUnavailable")}
            />
          </aside>

          <section
            ref={feedRef}
            aria-label={t("feed")}
            className="w-full min-w-0 scroll-mt-28 outline-none"
            tabIndex={-1}
          >
            <MomentFeedLayout
              busy={isLoading || isRefreshing}
              toolbar={
                <>
                  <MomentTopicWidget selected={topic} onSelect={selectTopic} />
                  <MomentSubscriptionDialog />
                </>
              }
            >
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
                  <EmptyState>
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
                    onEdit={
                      isAdmin && !isRefreshing && anchor.status !== "searching"
                        ? editMoment
                        : undefined
                    }
                  />

                  {visibleMoments.length === 0 && !isRefreshing && !isRefreshError ? (
                    <MomentState>
                      <EmptyState>
                        <EmptyState.Header>
                          <EmptyState.Title>{t(topic ? "emptyTopic" : "empty")}</EmptyState.Title>
                        </EmptyState.Header>
                        {topic ? (
                          <EmptyState.Content>
                            <Button size="sm" variant="secondary" onPress={() => selectTopic()}>
                              {t("showAll")}
                            </Button>
                          </EmptyState.Content>
                        ) : null}
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
        {isAdmin && editingMoment ? (
          <MomentPublisher
            key={editingMoment.id}
            initialMoment={editingMoment}
            isOpen
            onOpenChange={closeEditor}
            onSaved={updateMoment}
            protectUnsavedChanges
          />
        ) : null}
      </PageFrame>
    </MomentMotionProvider>
  );
});

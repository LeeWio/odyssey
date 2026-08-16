"use client";

import { Bell, Heart, Play } from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import { Button, Card, Chip, Skeleton, Tooltip, Typography, toast } from "@heroui/react";
import { useCallback, useMemo, useState } from "react";

import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  type MomentResponse,
  useGetLikedMomentIdsQuery,
  useGetPublicMomentsQuery,
  useLazyGetPublicMomentsQuery,
  useLikeMomentMutation,
  useUnlikeMomentMutation,
} from "@/lib/features/moment";
import { MomentMediaGallery } from "./moment-media-gallery";

const MOMENTS_PAGE_SIZE = 12;

function formatMomentDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatMomentTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function MomentSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading moments" className="space-y-5" role="status">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-8">
          <div className="hidden sm:block">
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
          <Card variant="secondary" className="gap-4 p-6">
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-5 w-full rounded-lg" />
            <Skeleton className="h-5 w-4/5 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </Card>
        </div>
      ))}
    </div>
  );
}

interface MomentItemProps {
  isLiked: boolean;
  isLiking: boolean;
  likesCount: number;
  moment: MomentResponse;
  onToggleLike: (id: number, isLiked: boolean) => void;
}

function MomentItem({ isLiked, isLiking, likesCount, moment, onToggleLike }: MomentItemProps) {
  return (
    <article className="group grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-8">
      <div className="hidden pt-5 text-right sm:block">
        <time className="text-muted text-sm" dateTime={moment.createdAt}>
          {formatMomentDate(moment.createdAt)}
        </time>
        <p className="text-muted mt-1 font-mono text-xs">{formatMomentTime(moment.createdAt)}</p>
      </div>

      <div className="sm:before:bg-default-200 relative min-w-0 sm:before:absolute sm:before:top-0 sm:before:-left-4 sm:before:h-full sm:before:w-px">
        <span
          aria-hidden="true"
          className="bg-accent ring-background absolute top-6 -left-[1.2rem] hidden size-2.5 rounded-full ring-4 sm:block"
        />
        <Card variant="secondary" className="gap-5 p-5 sm:p-6">
          <Card.Header className="gap-3 p-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Chip size="sm" variant="soft">
                Field note
              </Chip>
              <time className="text-muted font-mono text-xs sm:hidden" dateTime={moment.createdAt}>
                {formatMomentDate(moment.createdAt)} at {formatMomentTime(moment.createdAt)}
              </time>
            </div>
            <Card.Description className="text-foreground text-base leading-7 whitespace-pre-wrap sm:text-lg">
              {moment.content}
            </Card.Description>
          </Card.Header>
          <MomentMediaGallery images={moment.images} />
          <Card.Footer className="border-separator justify-between border-t p-0 pt-4">
            <Tooltip>
              <Button
                size="sm"
                variant={isLiked ? "danger" : "ghost"}
                isPending={isLiking}
                aria-label={isLiked ? "Unlike moment" : "Like moment"}
                onPress={() => onToggleLike(moment.id, isLiked)}
              >
                <Heart aria-hidden="true" className="size-4" />
                <span className="tabular-nums">{Math.max(0, likesCount)}</span>
              </Button>
              <Tooltip.Content>{isLiked ? "Liked" : "Like this moment"}</Tooltip.Content>
            </Tooltip>
            <span className="text-muted text-xs">A note from the day</span>
          </Card.Footer>
        </Card>
      </div>
    </article>
  );
}

export function PublicMomentsPage() {
  const [extraEntries, setExtraEntries] = useState<MomentResponse[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [likeOverrides, setLikeOverrides] = useState<Map<number, boolean>>(new Map());
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<number>>(new Set());
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const moments = useGetPublicMomentsQuery({ page: 0, size: MOMENTS_PAGE_SIZE });
  const [loadPage, loadingMore] = useLazyGetPublicMomentsQuery();
  const entries = useMemo(() => {
    const merged = new Map<number, MomentResponse>();
    moments.data?.list.forEach((moment) => merged.set(moment.id, moment));
    extraEntries.forEach((moment) => merged.set(moment.id, moment));
    return [...merged.values()];
  }, [extraEntries, moments.data?.list]);
  const momentIds = useMemo(() => entries.map(({ id }) => id), [entries]);
  const likedMoments = useGetLikedMomentIdsQuery(momentIds, {
    skip: !isAuthenticated || momentIds.length === 0,
  });
  const [likeMoment] = useLikeMomentMutation();
  const [unlikeMoment] = useUnlikeMomentMutation();
  const serverLikedIds = useMemo(() => new Set(likedMoments.data ?? []), [likedMoments.data]);

  const handleToggleLike = useCallback(
    async (id: number, isLiked: boolean) => {
      if (!isAuthenticated) {
        toast.warning("Sign in to like moments.");
        return;
      }
      if (pendingLikeIds.has(id)) return;

      setLikeOverrides((current) => {
        const next = new Map(current);
        next.set(id, !isLiked);
        return next;
      });
      setPendingLikeIds((current) => new Set(current).add(id));

      try {
        if (isLiked) await unlikeMoment(id).unwrap();
        else await likeMoment(id).unwrap();
      } catch {
        setLikeOverrides((current) => {
          const next = new Map(current);
          next.delete(id);
          return next;
        });
      } finally {
        setPendingLikeIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [isAuthenticated, likeMoment, pendingLikeIds, unlikeMoment]
  );

  const handleLoadMore = useCallback(async () => {
    try {
      const result = await loadPage({ page: nextPage, size: MOMENTS_PAGE_SIZE }).unwrap();
      setExtraEntries((current) => {
        const merged = new Map(current.map((moment) => [moment.id, moment]));
        result.list.forEach((moment) => merged.set(moment.id, moment));
        return [...merged.values()];
      });
      setNextPage((current) => current + 1);
    } catch {
      toast.danger("Couldn't load more moments.");
    }
  }, [loadPage, nextPage]);

  return (
    <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-4xl">
        <header className="max-w-2xl">
          <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
            <Bell aria-hidden="true" className="size-4" />
            Open notebook
          </div>
          <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
            Small things worth keeping.
          </Typography>
          <Typography color="muted" type="body" className="mt-5 max-w-xl">
            Short field notes from the work, the day, and everything noticed in between.
          </Typography>
        </header>

        <section aria-label="Moments timeline" className="mt-16">
          {moments.isLoading && entries.length === 0 ? (
            <MomentSkeleton />
          ) : moments.isError ? (
            <Card variant="secondary" className="items-start gap-3 p-7">
              <Card.Header>
                <Card.Title>Moments are unavailable</Card.Title>
                <Card.Description>Try loading this page again in a moment.</Card.Description>
              </Card.Header>
              <Card.Footer className="p-0">
                <Button size="sm" variant="secondary" onPress={() => moments.refetch()}>
                  Try again
                </Button>
              </Card.Footer>
            </Card>
          ) : entries.length > 0 ? (
            <div className="space-y-5 sm:space-y-7">
              {entries.map((moment) => (
                <MomentItem
                  key={moment.id}
                  isLiked={likeOverrides.get(moment.id) ?? serverLikedIds.has(moment.id)}
                  isLiking={pendingLikeIds.has(moment.id)}
                  likesCount={
                    moment.likesCount +
                    (likeOverrides.has(moment.id) &&
                    likeOverrides.get(moment.id) !== serverLikedIds.has(moment.id)
                      ? likeOverrides.get(moment.id)
                        ? 1
                        : -1
                      : 0)
                  }
                  moment={moment}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </div>
          ) : (
            <Card variant="secondary" className="p-0">
              <EmptyState size="lg">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Play aria-hidden="true" />
                  </EmptyState.Media>
                  <EmptyState.Title>No moments published yet</EmptyState.Title>
                  <EmptyState.Description>
                    Short notes will appear here as they are added to the notebook.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            </Card>
          )}
        </section>

        {moments.data && nextPage < moments.data.totalPages ? (
          <div className="border-default-200 mt-10 flex justify-center border-t pt-6">
            <Button isPending={loadingMore.isFetching} variant="secondary" onPress={handleLoadMore}>
              Load more moments
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { AlertDialog, Button, Card, Link, Tooltip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";

import {
  useClearReadingHistoryMutation,
  useDeleteReadingHistoryMutation,
  useGetReadingHistoryQuery,
} from "@/lib/features/library";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

import { HISTORY_PAGE_SIZE } from "./library-constants";
import { EmptyLibrarySection, LibraryPostVisual, LibrarySkeleton } from "./library-cards";

export function ReadingHistorySection() {
  const formatRelativeTime = useRelativeTime();
  const [page, setPage] = useState(0);
  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState<ReadonlySet<number>>(new Set());
  const inFlight = useRef(new Set<number>());
  const clearing = useRef(false);
  const active = useRef(true);
  const [deleteReadingHistory] = useDeleteReadingHistoryMutation();
  const [clearReadingHistory] = useClearReadingHistoryMutation();
  const history = useGetReadingHistoryQuery(
    { page, size: HISTORY_PAGE_SIZE, sort: ["lastReadAt,desc"] },
    { refetchOnMountOrArgChange: true }
  );
  const data = history.currentData;
  const historyEntries = data?.list ?? [];
  const lastPage = Math.max(0, (data?.totalPages ?? 1) - 1);
  const isAdjustingPage = history.isSuccess && !history.isFetching && !!data && page > lastPage;
  if (isAdjustingPage) setPage(lastPage);
  const isLoading = isAdjustingPage || history.isLoading || (history.isFetching && !data);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const handleRemoveHistoryEntry = async (postId: number) => {
    if (!active.current || clearing.current || inFlight.current.has(postId)) return;
    inFlight.current.add(postId);
    setPendingRemovals(new Set(inFlight.current));
    try {
      await deleteReadingHistory(postId).unwrap();
    } catch {
      // The mutation displays its own error toast; the record remains available for retry.
    } finally {
      inFlight.current.delete(postId);
      if (active.current) setPendingRemovals(new Set(inFlight.current));
    }
  };

  const handleClearHistory = async () => {
    if (!active.current || clearing.current || inFlight.current.size) return;
    clearing.current = true;
    setIsClearing(true);
    setClearError(null);
    try {
      await clearReadingHistory().unwrap();
      if (active.current) {
        setPage(0);
        setIsClearHistoryOpen(false);
      }
    } catch {
      if (active.current) setClearError("Reading history could not be cleared. Please try again.");
    } finally {
      clearing.current = false;
      if (active.current) setIsClearing(false);
    }
  };

  return (
    <section
      aria-labelledby="reading-history-title"
      aria-busy={history.isFetching || isAdjustingPage}
      className="mt-20"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography id="reading-history-title" type="h2" weight="semibold">
            Reading history
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            {data
              ? `${data.total.toLocaleString("en-US")} articles visited`
              : "Your recent reading"}
          </Typography>
        </div>
        {(data?.total ?? 0) > 0 ? (
          <Button
            size="sm"
            variant="danger"
            isDisabled={
              pendingRemovals.size > 0 || isClearing || history.isFetching || history.isError
            }
            onPress={() => {
              if (inFlight.current.size || clearing.current) return;
              setClearError(null);
              setIsClearHistoryOpen(true);
            }}
          >
            <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-4" />
            Clear history
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <LibrarySkeleton count={4} />
      ) : history.isError ? (
        <Card variant="secondary">
          <Card.Header>
            <Card.Title>Reading history is unavailable</Card.Title>
            <Card.Description>Please try loading this page again.</Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button size="sm" variant="secondary" onPress={() => history.refetch()}>
              Try again
            </Button>
          </Card.Footer>
        </Card>
      ) : historyEntries.length === 0 ? (
        <EmptyLibrarySection
          title="No reading history yet"
          description="Articles you open will appear here as you read."
        />
      ) : (
        <div className="divide-default-200 border-default-200 divide-y border-y">
          {historyEntries.map((entry) => {
            const href = getReadingPositionHref(entry.post.slug, entry.positionAnchor);
            const status =
              entry.progressPercent >= 100 ? "Finished" : `${entry.progressPercent}% read`;

            return (
              <article key={entry.post.id} className="flex gap-4 py-5 sm:items-center">
                <div className="hidden w-28 shrink-0 overflow-hidden sm:block">
                  <LibraryPostVisual post={entry.post} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <Link className="min-w-0 no-underline" href={href}>
                      <Typography className="line-clamp-2 text-base font-semibold" type="h3">
                        {entry.post.title}
                      </Typography>
                    </Link>
                    <Tooltip>
                      <Button
                        isIconOnly
                        aria-label={`Remove ${entry.post.title} from reading history`}
                        isDisabled={isClearing || pendingRemovals.has(entry.post.id)}
                        isPending={pendingRemovals.has(entry.post.id)}
                        size="sm"
                        variant="ghost"
                        onPress={() => handleRemoveHistoryEntry(entry.post.id)}
                      >
                        <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-4" />
                      </Button>
                      <Tooltip.Content>Remove from history</Tooltip.Content>
                    </Tooltip>
                  </div>
                  <div className="text-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <time dateTime={entry.lastReadAt}>
                      Read {formatRelativeTime(entry.lastReadAt)}
                    </time>
                    <span>{status}</span>
                    {entry.post.category?.name ? <span>{entry.post.category.name}</span> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!isAdjustingPage && (page > 0 || (data?.totalPages ?? 0) > 1) ? (
        <div className="mt-6 flex items-center justify-between gap-4">
          <Typography color="muted" type="body-xs">
            {data ? `Page ${page + 1} of ${data.totalPages}` : `Page ${page + 1}`}
          </Typography>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              isDisabled={page === 0 || history.isFetching || isClearing}
              onPress={() => setPage((page) => Math.max(0, page - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={history.isFetching || isClearing || !data || page >= lastPage}
              onPress={() => setPage((page) => page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isClearHistoryOpen}
          isDismissable={false}
          isKeyboardDismissDisabled={isClearing}
          onOpenChange={(open) => {
            if (!clearing.current) setIsClearHistoryOpen(open);
          }}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger isDisabled={isClearing} />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Clear reading history?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  This removes all saved reading activity. This action cannot be undone.
                </p>
                {clearError ? (
                  <p role="alert" className="text-danger mt-3 text-sm">
                    {clearError}
                  </p>
                ) : null}
                {isClearing ? (
                  <p role="status" className="text-muted mt-3 text-sm">
                    Clearing reading history…
                  </p>
                ) : null}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button isDisabled={isClearing} slot="close" size="sm" variant="tertiary">
                  Cancel
                </Button>
                <Button
                  isDisabled={pendingRemovals.size > 0}
                  isPending={isClearing}
                  size="sm"
                  variant="danger"
                  onPress={handleClearHistory}
                >
                  Clear history
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </section>
  );
}

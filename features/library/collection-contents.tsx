"use client";

import { Button, Card, Link, Tooltip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

import {
  type PostCollectionResponse,
  useGetCollectionPostsQuery,
  useRemovePostFromCollectionMutation,
} from "@/lib/features/library";

import { EmptyLibrarySection, LibraryPostVisual, LibrarySkeleton } from "./library-cards";
import { formatDate } from "./library-format";

export function CollectionContents({ collection }: { collection: PostCollectionResponse }) {
  const [page, setPage] = useState(0);
  const inFlight = useRef(new Set<number>());
  const [pendingRemovals, setPendingRemovals] = useState<ReadonlySet<number>>(new Set());
  const [removePost] = useRemovePostFromCollectionMutation();
  const query = useGetCollectionPostsQuery(
    { collectionId: collection.id, page, size: 20, sort: ["addedAt,desc"] },
    { refetchOnMountOrArgChange: true }
  );
  const data = query.currentData;
  const lastPage = Math.max(0, (data?.totalPages ?? 1) - 1);
  const isAdjustingPage = query.isSuccess && !query.isFetching && !!data && page > lastPage;
  if (isAdjustingPage) setPage(lastPage);
  const isLoading = isAdjustingPage || query.isLoading || (query.isFetching && !data);

  const handleRemove = async (postId: number) => {
    if (inFlight.current.has(postId)) return;
    inFlight.current.add(postId);
    setPendingRemovals(new Set(inFlight.current));
    try {
      await removePost({ collectionId: collection.id, postId }).unwrap();
    } catch {
      // The mutation displays its own failure toast; the entry remains available for retry.
    } finally {
      inFlight.current.delete(postId);
      setPendingRemovals(new Set(inFlight.current));
    }
  };

  return (
    <div aria-busy={query.isFetching || isAdjustingPage}>
      {isLoading ? (
        <LibrarySkeleton count={2} />
      ) : query.isError ? (
        <Card variant="secondary">
          <Card.Header>
            <Card.Title>Collection articles are unavailable</Card.Title>
            <Card.Description>Please try loading this page again.</Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button size="sm" variant="secondary" onPress={() => query.refetch()}>
              Try again
            </Button>
          </Card.Footer>
        </Card>
      ) : !data?.list.length ? (
        <EmptyLibrarySection
          title="This collection is empty"
          description="Open an article and use the collection action to add it here."
        />
      ) : (
        <div className="divide-default-200 border-default-200 divide-y border-y">
          {data.list.map(({ addedAt, post }) => (
            <article key={post.id} className="flex gap-4 py-5 sm:items-center">
              <div className="hidden w-28 shrink-0 overflow-hidden sm:block">
                <LibraryPostVisual post={post} />
              </div>
              <div className="min-w-0 flex-1">
                <Link className="no-underline" href={`/single/${post.slug}`}>
                  <Typography className="line-clamp-2 text-base font-semibold" type="h4">
                    {post.title}
                  </Typography>
                </Link>
                <Typography color="muted" type="body-xs" className="mt-2">
                  Added {formatDate(addedAt)}
                </Typography>
              </div>
              <Tooltip>
                <Button
                  isIconOnly
                  aria-label={`Remove ${post.title} from ${collection.name}`}
                  isPending={pendingRemovals.has(post.id)}
                  isDisabled={pendingRemovals.has(post.id)}
                  size="sm"
                  variant="ghost"
                  onPress={() => handleRemove(post.id)}
                >
                  <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-4" />
                </Button>
                <Tooltip.Content>Remove from collection</Tooltip.Content>
              </Tooltip>
            </article>
          ))}
        </div>
      )}
      {!isAdjustingPage && (page > 0 || (data?.totalPages ?? 0) > 1) ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Typography color="muted" type="body-sm">
            {data
              ? `Page ${page + 1} of ${data.totalPages} · ${data.total} articles`
              : `Page ${page + 1}`}
          </Typography>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              isDisabled={page === 0 || query.isFetching}
              onPress={() => setPage((current) => Math.max(0, current - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={query.isFetching || !data || page >= lastPage}
              onPress={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

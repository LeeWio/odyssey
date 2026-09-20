"use client";

import { EmptyState } from "@heroui-pro/react";
import {
  AlertDialog,
  Button,
  Card,
  Checkbox,
  Chip,
  Link,
  ProgressBar,
  ScrollShadow,
  Skeleton,
  Tooltip,
  Typography,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";

import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useRetrieveFacetsQuery } from "@/lib/features/openapi";
import {
  type FavoritePostResponse,
  type PostCollectionResponse,
  type RecommendedPostResponse,
  type ReadingHistoryResponse,
  useClearReadingHistoryMutation,
  useClearHiddenRecommendationsMutation,
  useDeleteReadingHistoryMutation,
  useGetCollectionPostsQuery,
  useGetContentPreferencesQuery,
  useGetFavoritePostsQuery,
  useGetFollowingFeedQuery,
  useGetLibraryOverviewQuery,
  useGetPostCollectionsQuery,
  useGetReadingHistoryQuery,
  useHideRecommendationMutation,
  useFollowCategoryMutation,
  useRemovePostFromCollectionMutation,
  useUnfollowCategoryMutation,
} from "@/lib/features/library";
import type { PostDigestResponse } from "@/lib/features/post";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import { CollectionFormDialog, DeleteCollectionDialog } from "./collection-management-dialogs";

const HISTORY_PAGE_SIZE = 10;
const FOLLOWING_PAGE_SIZE = 6;

function formatDate(value?: string | null) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function LibraryPostVisual({ post }: { post: PostDigestResponse }) {
  return (
    <SmartColorSurface
      className="h-full"
      seed={`library-${post.slug}`}
      tone={getSmartColorTone({ categoryName: post.category?.name, title: post.title })}
    >
      <div aria-hidden="true" className="aspect-[16/10] w-full" />
    </SmartColorSurface>
  );
}

function RecommendedCard({
  entry,
  isHiding,
  onHide,
}: {
  entry: RecommendedPostResponse;
  isHiding: boolean;
  onHide: (postId: number) => void;
}) {
  const { post } = entry;

  return (
    <Card variant="secondary" className="h-full overflow-hidden p-0">
      <LibraryPostVisual post={post} />
      <Card.Header className="gap-3">
        <div className="flex items-center justify-between gap-3">
          {post.category?.name ? (
            <Chip size="sm" variant="soft">
              {post.category.name}
            </Chip>
          ) : (
            <span />
          )}
          <Tooltip>
            <Button
              isIconOnly
              aria-label={`Hide recommendation for ${post.title}`}
              isPending={isHiding}
              size="sm"
              variant="ghost"
              onPress={() => onHide(post.id)}
            >
              <Icon aria-hidden="true" className="size-4" icon="lucide:x" />
            </Button>
            <Tooltip.Content>Not interested</Tooltip.Content>
          </Tooltip>
        </div>
        <Link className="no-underline" href={`/single/${post.slug}`}>
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
        </Link>
        {post.summary ? (
          <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Footer className="mt-auto justify-between gap-3">
        <Typography color="muted" type="body-xs" className="line-clamp-1">
          {entry.reason}
        </Typography>
        <Link
          className="text-accent shrink-0 text-sm font-medium no-underline"
          href={`/single/${post.slug}`}
        >
          Read
        </Link>
      </Card.Footer>
    </Card>
  );
}

function ReadingCard({ entry }: { entry: ReadingHistoryResponse }) {
  const formatRelativeTime = useRelativeTime();
  const { lastReadAt, post, positionAnchor, progressPercent } = entry;
  const href = getReadingPositionHref(post.slug, positionAnchor);

  return (
    <Link className="block h-full no-underline" href={href}>
      <Card variant="secondary" className="h-full overflow-hidden p-0">
        <LibraryPostVisual post={post} />
        <Card.Header className="gap-3">
          <div className="flex items-start justify-between gap-3">
            {post.category?.name ? (
              <Chip size="sm" variant="soft">
                {post.category.name}
              </Chip>
            ) : (
              <span />
            )}
            <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
              {progressPercent}%
            </span>
          </div>
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto flex-col items-stretch gap-3">
          <ProgressBar
            aria-label={`${post.title} reading progress`}
            color="accent"
            size="sm"
            value={progressPercent}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <div className="flex items-center justify-between gap-3">
            <Typography color="muted" type="body-xs" className="line-clamp-1">
              Read {formatRelativeTime(lastReadAt)}
            </Typography>
            <span className="text-accent inline-flex shrink-0 items-center gap-1.5 text-sm font-medium">
              Continue
              <Icon icon="gravity-ui:play" aria-hidden="true" className="size-3.5" />
            </span>
          </div>
        </Card.Footer>
      </Card>
    </Link>
  );
}

function FavoriteCard({ entry }: { entry: FavoritePostResponse }) {
  const { post } = entry;

  return (
    <Link className="block h-full no-underline" href={`/single/${post.slug}`}>
      <Card variant="secondary" className="h-full overflow-hidden p-0">
        <LibraryPostVisual post={post} />
        <Card.Header className="gap-3">
          <div className="flex items-center justify-between gap-3">
            {post.category?.name ? (
              <Chip size="sm" variant="soft">
                {post.category.name}
              </Chip>
            ) : (
              <span />
            )}
            <Icon
              icon="gravity-ui:heart"
              aria-hidden="true"
              className="text-danger size-4 shrink-0"
            />
          </div>
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto justify-between gap-3">
          <Typography color="muted" type="body-xs">
            Saved {formatDate(entry.favoritedAt)}
          </Typography>
          <span className="text-accent text-sm font-medium">Read</span>
        </Card.Footer>
      </Card>
    </Link>
  );
}

function FollowingCard({ post }: { post: PostDigestResponse }) {
  return (
    <Link className="block h-full no-underline" href={`/single/${post.slug}`}>
      <Card variant="secondary" className="h-full overflow-hidden p-0">
        <LibraryPostVisual post={post} />
        <Card.Header className="gap-3">
          {post.category?.name ? (
            <Chip size="sm" variant="soft">
              {post.category.name}
            </Chip>
          ) : null}
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto justify-between gap-3">
          <Typography color="muted" type="body-xs">
            {formatDate(post.publishedAt)}
          </Typography>
          <Typography
            color="muted"
            type="body-xs"
            className="flex shrink-0 items-center gap-1.5 tabular-nums"
          >
            <Icon icon="gravity-ui:eye" aria-hidden="true" className="size-3.5" />
            {post.views.toLocaleString("en-US")}
          </Typography>
        </Card.Footer>
      </Card>
    </Link>
  );
}

function LibrarySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading library"
      className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      role="status"
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} variant="secondary" className="overflow-hidden p-0">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <Card.Header>
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-6 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </Card.Header>
        </Card>
      ))}
    </div>
  );
}

function EmptyLibrarySection({ description, title }: { description: string; title: string }) {
  return (
    <Card variant="secondary" className="items-start gap-2 p-7">
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
    </Card>
  );
}

function CollectionCard({
  collection,
  isSelected,
  onDelete,
  onEdit,
  onSelect,
}: {
  collection: PostCollectionResponse;
  isSelected: boolean;
  onDelete: (collection: PostCollectionResponse) => void;
  onEdit: (collection: PostCollectionResponse) => void;
  onSelect: (collectionId: number) => void;
}) {
  return (
    <Card
      variant={isSelected ? "tertiary" : "secondary"}
      className="h-full gap-4 p-5 transition-colors"
    >
      <Card.Header className="gap-2 p-0">
        <div className="flex items-start justify-between gap-3">
          <Chip size="sm" variant="soft">
            {collection.itemCount} {collection.itemCount === 1 ? "article" : "articles"}
          </Chip>
          <div className="flex shrink-0 gap-1">
            <Tooltip>
              <Button
                isIconOnly
                aria-label={`Edit ${collection.name}`}
                size="sm"
                variant="ghost"
                onPress={() => onEdit(collection)}
              >
                <Icon icon="gravity-ui:pencil" aria-hidden="true" className="size-3.5" />
              </Button>
              <Tooltip.Content>Edit collection</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Button
                isIconOnly
                aria-label={`Delete ${collection.name}`}
                size="sm"
                variant="ghost"
                onPress={() => onDelete(collection)}
              >
                <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-3.5" />
              </Button>
              <Tooltip.Content>Delete collection</Tooltip.Content>
            </Tooltip>
          </div>
        </div>
        <Card.Title className="line-clamp-2 text-lg">{collection.name}</Card.Title>
        {collection.description ? (
          <Card.Description className="line-clamp-2">{collection.description}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Footer className="mt-auto justify-end p-0">
        <Button
          aria-label={`View collection: ${collection.name}`}
          aria-pressed={isSelected}
          size="sm"
          variant={isSelected ? "secondary" : "ghost"}
          onPress={() => onSelect(collection.id)}
        >
          {isSelected ? "Viewing" : "View collection"}
        </Button>
      </Card.Footer>
    </Card>
  );
}

function ReadingHistorySection() {
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

/** A new collection starts on page one with its own query and pending removals. */
function CollectionContents({ collection }: { collection: PostCollectionResponse }) {
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

export function LibraryPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [followingPage, setFollowingPage] = useState(0);
  const [recommendationPendingRemoval, setRecommendationPendingRemoval] = useState<number | null>(
    null
  );
  const [collectionForm, setCollectionForm] = useState<{
    collection: PostCollectionResponse | null;
  } | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collectionPendingDeletion, setCollectionPendingDeletion] =
    useState<PostCollectionResponse | null>(null);
  const [categoryPendingId, setCategoryPendingId] = useState<number | null>(null);

  const overview = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });
  const preferences = useGetContentPreferencesQuery(undefined, { skip: !isAuthenticated });
  const { data: facets } = useRetrieveFacetsQuery();
  const favorites = useGetFavoritePostsQuery(
    { page: 0, size: 6, sort: ["favoritedAt,desc"] },
    { skip: !isAuthenticated }
  );
  const followedCategories = preferences.data?.followedCategories ?? [];
  const following = useGetFollowingFeedQuery(
    { page: followingPage, size: FOLLOWING_PAGE_SIZE, sort: ["publishedAt,desc"] },
    { skip: !isAuthenticated || preferences.isLoading || followedCategories.length === 0 }
  );
  const collections = useGetPostCollectionsQuery(undefined, { skip: !isAuthenticated });
  const selectedCollection = collections.data?.find(
    (collection) => collection.id === selectedCollectionId
  );
  const [hideRecommendation] = useHideRecommendationMutation();
  const [followCategory] = useFollowCategoryMutation();
  const [unfollowCategory] = useUnfollowCategoryMutation();
  const [clearHiddenRecommendations, { isLoading: isClearingHiddenRecommendations }] =
    useClearHiddenRecommendationsMutation();

  const continueReading = (overview.data?.continueReading ?? []).filter(
    (entry) => entry.progressPercent < 100
  );
  const recommendations = overview.data?.recommendations ?? [];
  const followingPosts = following.data?.list ?? [];
  const followedCategoryIds = new Set(followedCategories.map((category) => category.id));
  const preferenceCategories = (facets?.categories ?? [])
    .flatMap((category) =>
      category.id != null && category.name && (category.count ?? 0) > 0
        ? [{ count: category.count ?? 0, id: category.id, name: category.name }]
        : []
    )
    .slice(0, 12);

  const handleHideRecommendation = async (postId: number) => {
    setRecommendationPendingRemoval(postId);
    try {
      await hideRecommendation(postId).unwrap();
    } catch {
      // The mutation displays its own failure toast.
    } finally {
      setRecommendationPendingRemoval(null);
    }
  };

  const handleCategoryPreference = async (categoryId: number) => {
    setCategoryPendingId(categoryId);
    try {
      if (followedCategoryIds.has(categoryId)) {
        await unfollowCategory(categoryId).unwrap();
      } else {
        await followCategory(categoryId).unwrap();
      }
      setFollowingPage(0);
    } catch {
      // The mutations display their own failure toast.
    } finally {
      setCategoryPendingId(null);
    }
  };

  const handleClearHiddenRecommendations = async () => {
    try {
      await clearHiddenRecommendations().unwrap();
    } catch {
      // The mutation displays its own failure toast.
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-lg">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="gravity-ui:book-open" aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>Your reading library</EmptyState.Title>
              <EmptyState.Description>
                Sign in to keep your place, revisit saved articles, and manage your reading history.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>Sign in</Button>
              <Link className="no-underline" href="/blog">
                Browse articles
              </Link>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-3xl">
          <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
            <Icon icon="gravity-ui:book-open" aria-hidden="true" className="size-4" />
            Personal library
          </div>
          <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
            Keep the ideas you want to return to.
          </Typography>
          <Typography color="muted" type="body" className="mt-5 max-w-xl">
            Your reading progress, saved writing, and recent history in one place.
          </Typography>
        </header>

        <section aria-labelledby="continue-reading-title" className="mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Typography id="continue-reading-title" type="h2" weight="semibold">
                Continue reading
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-1">
                Pick up exactly where you left off.
              </Typography>
            </div>
            <Link className="text-accent text-sm font-medium no-underline" href="/blog">
              Browse all writing
            </Link>
          </div>
          {overview.isLoading ? (
            <LibrarySkeleton />
          ) : overview.isError ? (
            <EmptyLibrarySection
              title="Reading progress is unavailable"
              description="Try loading this page again in a moment."
            />
          ) : continueReading.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {continueReading.slice(0, 6).map((entry) => (
                <ReadingCard key={entry.post.id} entry={entry} />
              ))}
            </div>
          ) : (
            <EmptyLibrarySection
              title="Nothing in progress"
              description="Start an article and your place will be saved here."
            />
          )}
        </section>

        <section aria-labelledby="following-title" className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Typography id="following-title" type="h2" weight="semibold">
                From topics you follow
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-1">
                New writing from the subjects you asked to see more often.
              </Typography>
            </div>
            {followedCategories.length > 0 ? (
              <Link
                className="text-accent text-sm font-medium no-underline"
                href="#reading-preferences-title"
              >
                Tune topics
              </Link>
            ) : null}
          </div>

          {preferences.isLoading ? (
            <LibrarySkeleton />
          ) : preferences.isError ? (
            <EmptyLibrarySection
              title="Followed topics are unavailable"
              description="Try loading this page again in a moment."
            />
          ) : followedCategories.length === 0 ? (
            <EmptyLibrarySection
              title="Follow a topic to build your feed"
              description="Choose topics below and their latest articles will appear here."
            />
          ) : following.isLoading ? (
            <LibrarySkeleton />
          ) : following.isError ? (
            <EmptyLibrarySection
              title="Your followed feed is unavailable"
              description="Try loading this page again in a moment."
            />
          ) : followingPosts.length > 0 ? (
            <>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {followingPosts.map((post) => (
                  <FollowingCard key={post.id} post={post} />
                ))}
              </div>
              {following.data && following.data.totalPages > 1 ? (
                <div className="mt-6 flex items-center justify-between gap-4">
                  <Typography color="muted" type="body-xs">
                    {following.data.total.toLocaleString("en-US")} articles from followed topics
                  </Typography>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      isDisabled={followingPage === 0}
                      onPress={() => setFollowingPage((page) => Math.max(0, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      isDisabled={followingPage >= following.data.totalPages - 1}
                      onPress={() => setFollowingPage((page) => page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyLibrarySection
              title="Nothing new from followed topics"
              description="When new articles are published in your selected topics, they will show up here."
            />
          )}
        </section>

        <section aria-labelledby="favorites-title" className="mt-20">
          <div className="mb-6">
            <Typography id="favorites-title" type="h2" weight="semibold">
              Saved writing
            </Typography>
            <Typography color="muted" type="body-sm" className="mt-1">
              Articles you marked to revisit.
            </Typography>
          </div>
          {favorites.isLoading ? (
            <LibrarySkeleton />
          ) : favorites.isError ? (
            <EmptyLibrarySection
              title="Saved writing is unavailable"
              description="Try loading this page again in a moment."
            />
          ) : (favorites.data?.list.length ?? 0) > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {favorites.data?.list.map((entry) => (
                <FavoriteCard key={entry.post.id} entry={entry} />
              ))}
            </div>
          ) : (
            <EmptyLibrarySection
              title="No saved articles yet"
              description="Use the favorite action on an article to keep it close."
            />
          )}
        </section>

        <section aria-labelledby="collections-title" className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Typography id="collections-title" type="h2" weight="semibold">
                Collections
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-1">
                Group the writing you want to keep together.
              </Typography>
            </div>
            <Button size="sm" onPress={() => setCollectionForm({ collection: null })}>
              <Icon icon="gravity-ui:circle-plus" aria-hidden="true" className="size-4" />
              New collection
            </Button>
          </div>

          {collections.isLoading ? (
            <LibrarySkeleton />
          ) : collections.isError ? (
            <EmptyLibrarySection
              title="Collections are unavailable"
              description="Try loading this page again in a moment."
            />
          ) : (collections.data?.length ?? 0) > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {collections.data?.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  isSelected={collection.id === selectedCollectionId}
                  onDelete={setCollectionPendingDeletion}
                  onEdit={(collection) => setCollectionForm({ collection })}
                  onSelect={setSelectedCollectionId}
                />
              ))}
            </div>
          ) : (
            <EmptyLibrarySection
              title="Start your first collection"
              description="Create a collection from an article to gather related reading in one place."
            />
          )}

          {selectedCollection ? (
            <div
              role="region"
              aria-label={`Articles in ${selectedCollection.name}`}
              className="border-default-200 mt-8 border-t pt-8"
            >
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <Typography type="h3" weight="semibold">
                    {selectedCollection.name}
                  </Typography>
                  {selectedCollection.description ? (
                    <Typography color="muted" type="body-sm" className="mt-1">
                      {selectedCollection.description}
                    </Typography>
                  ) : null}
                </div>
                <Button size="sm" variant="ghost" onPress={() => setSelectedCollectionId(null)}>
                  Close
                </Button>
              </div>

              <CollectionContents key={selectedCollection.id} collection={selectedCollection} />
            </div>
          ) : null}
        </section>

        <section aria-labelledby="reading-preferences-title" className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Typography id="reading-preferences-title" type="h2" weight="semibold">
                Reading preferences
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-1">
                Tune the topics that help shape your recommendations.
              </Typography>
            </div>
            {preferences.data && preferences.data.hiddenPostCount > 0 ? (
              <Button
                isPending={isClearingHiddenRecommendations}
                size="sm"
                variant="secondary"
                onPress={handleClearHiddenRecommendations}
              >
                <Icon aria-hidden="true" className="size-4" icon="lucide:rotate-ccw" />
                Restore {preferences.data.hiddenPostCount} hidden
              </Button>
            ) : null}
          </div>

          {preferences.isLoading ? (
            <Card variant="secondary" className="gap-4 p-6">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </Card>
          ) : preferences.isError ? (
            <EmptyLibrarySection
              title="Preferences are unavailable"
              description="Try loading this page again in a moment."
            />
          ) : preferenceCategories.length > 0 ? (
            <Card variant="secondary" className="gap-5 p-6">
              <Card.Header className="gap-1 p-0">
                <Card.Title className="text-base">Topics to follow</Card.Title>
                <Card.Description>
                  Follow the subjects you want to see more often in your library.
                </Card.Description>
              </Card.Header>
              <ScrollShadow hideScrollBar className="max-h-56" orientation="vertical">
                <div className="grid gap-2 sm:grid-cols-2">
                  {preferenceCategories.map((category) => {
                    const isFollowed = followedCategoryIds.has(category.id);

                    return (
                      <Checkbox
                        key={category.id}
                        isDisabled={categoryPendingId === category.id}
                        isSelected={isFollowed}
                        onChange={() => handleCategoryPreference(category.id)}
                      >
                        <Checkbox.Content>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                            <span className="truncate text-sm font-medium">{category.name}</span>
                            <span className="text-muted shrink-0 text-xs tabular-nums">
                              {category.count}
                            </span>
                          </span>
                        </Checkbox.Content>
                      </Checkbox>
                    );
                  })}
                </div>
              </ScrollShadow>
              {(preferences.data?.followedCategories.length ?? 0) > 0 ? (
                <div className="border-separator flex flex-wrap items-center gap-2 border-t pt-4">
                  <Typography color="muted" type="body-xs">
                    Following
                  </Typography>
                  {preferences.data?.followedCategories.map((category) => (
                    <Chip key={category.id} size="sm" variant="soft">
                      {category.name}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : (
            <EmptyLibrarySection
              title="No topics available yet"
              description="Published topics will appear here when there is more writing to follow."
            />
          )}
        </section>

        {!overview.isLoading && !overview.isError && recommendations.length > 0 ? (
          <section aria-labelledby="recommendations-title" className="mt-20">
            <div className="mb-6">
              <Typography id="recommendations-title" type="h2" weight="semibold">
                Recommended for you
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-1">
                Suggestions shaped by the writing you have saved and read.
              </Typography>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.slice(0, 6).map((entry) => (
                <RecommendedCard
                  key={entry.post.id}
                  entry={entry}
                  isHiding={recommendationPendingRemoval === entry.post.id}
                  onHide={handleHideRecommendation}
                />
              ))}
            </div>
          </section>
        ) : null}

        <ReadingHistorySection />
      </div>

      {collectionForm ? (
        <CollectionFormDialog
          key={collectionForm.collection?.id ?? "new"}
          collection={collectionForm.collection}
          onClose={() => setCollectionForm(null)}
          onSaved={(collection) => {
            setSelectedCollectionId(collection.id);
            setCollectionForm(null);
          }}
        />
      ) : null}
      {collectionPendingDeletion ? (
        <DeleteCollectionDialog
          key={collectionPendingDeletion.id}
          collection={collectionPendingDeletion}
          onClose={() => setCollectionPendingDeletion(null)}
          onDeleted={(collectionId) => {
            setSelectedCollectionId((current) => (current === collectionId ? null : current));
            setCollectionPendingDeletion(null);
          }}
        />
      ) : null}
    </div>
  );
}

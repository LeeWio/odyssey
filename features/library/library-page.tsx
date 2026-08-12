"use client";

import { CirclePlus, Pencil, BookOpen, Heart, Play, TrashBin } from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import {
  AlertDialog,
  Button,
  Card,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  Modal,
  ProgressBar,
  Skeleton,
  TextArea,
  TextField,
  Tooltip,
  Typography,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { type FormEvent, useState } from "react";

import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  type FavoritePostResponse,
  type PostCollectionResponse,
  type RecommendedPostResponse,
  type ReadingHistoryResponse,
  useCreatePostCollectionMutation,
  useClearReadingHistoryMutation,
  useDeletePostCollectionMutation,
  useDeleteReadingHistoryMutation,
  useGetCollectionPostsQuery,
  useGetFavoritePostsQuery,
  useGetLibraryOverviewQuery,
  useGetPostCollectionsQuery,
  useGetReadingHistoryQuery,
  useHideRecommendationMutation,
  useRemovePostFromCollectionMutation,
  useUpdatePostCollectionMutation,
} from "@/lib/features/library";
import type { PostDigestResponse } from "@/lib/features/post";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const HISTORY_PAGE_SIZE = 10;

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
  const { post, progressPercent } = entry;

  return (
    <Link className="block h-full no-underline" href={`/single/${post.slug}`}>
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
          <span className="text-accent inline-flex items-center justify-end gap-1.5 text-sm font-medium">
            Continue
            <Play aria-hidden="true" className="size-3.5" />
          </span>
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
            <Heart aria-hidden="true" className="text-danger size-4 shrink-0" />
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
                <Pencil aria-hidden="true" className="size-3.5" />
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
                <TrashBin aria-hidden="true" className="size-3.5" />
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

export function LibraryPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [historyPage, setHistoryPage] = useState(0);
  const [entryPendingRemoval, setEntryPendingRemoval] = useState<number | null>(null);
  const [recommendationPendingRemoval, setRecommendationPendingRemoval] = useState<number | null>(
    null
  );
  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);
  const [isCollectionFormOpen, setIsCollectionFormOpen] = useState(false);
  const [isCollectionDeleteOpen, setIsCollectionDeleteOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collectionPendingDeletion, setCollectionPendingDeletion] =
    useState<PostCollectionResponse | null>(null);
  const [collectionBeingEdited, setCollectionBeingEdited] = useState<PostCollectionResponse | null>(
    null
  );
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionPostPendingRemoval, setCollectionPostPendingRemoval] = useState<number | null>(
    null
  );

  const overview = useGetLibraryOverviewQuery(undefined, { skip: !isAuthenticated });
  const favorites = useGetFavoritePostsQuery(
    { page: 0, size: 6, sort: ["favoritedAt,desc"] },
    { skip: !isAuthenticated }
  );
  const history = useGetReadingHistoryQuery(
    { page: historyPage, size: HISTORY_PAGE_SIZE, sort: ["lastReadAt,desc"] },
    { skip: !isAuthenticated }
  );
  const collections = useGetPostCollectionsQuery(undefined, { skip: !isAuthenticated });
  const selectedCollection = collections.data?.find(
    (collection) => collection.id === selectedCollectionId
  );
  const collectionPosts = useGetCollectionPostsQuery(
    { collectionId: selectedCollection?.id ?? 0, page: 0, size: 20, sort: ["addedAt,desc"] },
    { skip: !isAuthenticated || !selectedCollection }
  );
  const [createPostCollection, { isLoading: isCreatingCollection }] =
    useCreatePostCollectionMutation();
  const [updatePostCollection, { isLoading: isUpdatingCollection }] =
    useUpdatePostCollectionMutation();
  const [deletePostCollection, { isLoading: isDeletingCollection }] =
    useDeletePostCollectionMutation();
  const [removePostFromCollection] = useRemovePostFromCollectionMutation();
  const [deleteReadingHistory] = useDeleteReadingHistoryMutation();
  const [hideRecommendation] = useHideRecommendationMutation();
  const [clearReadingHistory, { isLoading: isClearingHistory }] = useClearReadingHistoryMutation();

  const continueReading = (overview.data?.continueReading ?? []).filter(
    (entry) => entry.progressPercent < 100
  );
  const historyEntries = history.data?.list ?? [];
  const recommendations = overview.data?.recommendations ?? [];
  const selectedCollectionPosts = collectionPosts.data?.list ?? [];

  const handleRemoveHistoryEntry = async (postId: number) => {
    setEntryPendingRemoval(postId);
    try {
      await deleteReadingHistory(postId).unwrap();
    } catch {
      // The mutation displays its own failure toast.
    } finally {
      setEntryPendingRemoval(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearReadingHistory().unwrap();
      setHistoryPage(0);
      setIsClearHistoryOpen(false);
    } catch {
      // The mutation displays its own failure toast.
    }
  };

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

  const openCreateCollection = () => {
    setCollectionBeingEdited(null);
    setCollectionName("");
    setCollectionDescription("");
    setIsCollectionFormOpen(true);
  };

  const openEditCollection = (collection: PostCollectionResponse) => {
    setCollectionBeingEdited(collection);
    setCollectionName(collection.name);
    setCollectionDescription(collection.description || "");
    setIsCollectionFormOpen(true);
  };

  const handleCollectionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = {
      name: collectionName.trim(),
      description: collectionDescription.trim() || undefined,
    };

    try {
      const collection = collectionBeingEdited
        ? await updatePostCollection({ collectionId: collectionBeingEdited.id, body }).unwrap()
        : await createPostCollection(body).unwrap();

      setSelectedCollectionId(collection.id);
      setIsCollectionFormOpen(false);
    } catch {
      // The mutations display their own failure toast.
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionPendingDeletion) return;

    try {
      await deletePostCollection(collectionPendingDeletion.id).unwrap();
      if (selectedCollectionId === collectionPendingDeletion.id) setSelectedCollectionId(null);
      setIsCollectionDeleteOpen(false);
      setCollectionPendingDeletion(null);
    } catch {
      // The mutation displays its own failure toast.
    }
  };

  const handleRemoveCollectionPost = async (postId: number) => {
    if (!selectedCollectionId) return;

    setCollectionPostPendingRemoval(postId);
    try {
      await removePostFromCollection({ collectionId: selectedCollectionId, postId }).unwrap();
    } catch {
      // The mutation displays its own failure toast.
    } finally {
      setCollectionPostPendingRemoval(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-lg">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <BookOpen aria-hidden="true" />
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
            <BookOpen aria-hidden="true" className="size-4" />
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
            <Button size="sm" onPress={openCreateCollection}>
              <CirclePlus aria-hidden="true" className="size-4" />
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
                  onDelete={(nextCollection) => {
                    setCollectionPendingDeletion(nextCollection);
                    setIsCollectionDeleteOpen(true);
                  }}
                  onEdit={openEditCollection}
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
            <div className="border-default-200 mt-8 border-t pt-8">
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

              {collectionPosts.isLoading ? (
                <LibrarySkeleton count={2} />
              ) : collectionPosts.isError ? (
                <EmptyLibrarySection
                  title="Collection articles are unavailable"
                  description="Try opening this collection again in a moment."
                />
              ) : selectedCollectionPosts.length === 0 ? (
                <EmptyLibrarySection
                  title="This collection is empty"
                  description="Open an article and use the collection action to add it here."
                />
              ) : (
                <div className="divide-default-200 border-default-200 divide-y border-y">
                  {selectedCollectionPosts.map(({ addedAt, post }) => (
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
                          aria-label={`Remove ${post.title} from ${selectedCollection.name}`}
                          isPending={collectionPostPendingRemoval === post.id}
                          size="sm"
                          variant="ghost"
                          onPress={() => handleRemoveCollectionPost(post.id)}
                        >
                          <TrashBin aria-hidden="true" className="size-4" />
                        </Button>
                        <Tooltip.Content>Remove from collection</Tooltip.Content>
                      </Tooltip>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
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

        <section aria-labelledby="reading-history-title" className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Typography id="reading-history-title" type="h2" weight="semibold">
                Reading history
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-1">
                {history.data
                  ? `${history.data.total.toLocaleString("en-US")} articles visited`
                  : "Your recent reading"}
              </Typography>
            </div>
            {historyEntries.length > 0 ? (
              <Button size="sm" variant="danger" onPress={() => setIsClearHistoryOpen(true)}>
                <TrashBin aria-hidden="true" className="size-4" />
                Clear history
              </Button>
            ) : null}
          </div>

          {history.isLoading ? (
            <LibrarySkeleton count={4} />
          ) : history.isError ? (
            <EmptyLibrarySection
              title="Reading history is unavailable"
              description="Try loading this page again in a moment."
            />
          ) : historyEntries.length === 0 ? (
            <EmptyLibrarySection
              title="No reading history yet"
              description="Articles you open will appear here as you read."
            />
          ) : (
            <div className="divide-default-200 border-default-200 divide-y border-y">
              {historyEntries.map((entry) => (
                <article key={entry.post.id} className="flex gap-4 py-5 sm:items-center">
                  <div className="hidden w-28 shrink-0 overflow-hidden sm:block">
                    <LibraryPostVisual post={entry.post} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link className="min-w-0 no-underline" href={`/single/${entry.post.slug}`}>
                        <Typography className="line-clamp-2 text-base font-semibold" type="h3">
                          {entry.post.title}
                        </Typography>
                      </Link>
                      <Tooltip>
                        <Button
                          isIconOnly
                          aria-label={`Remove ${entry.post.title} from reading history`}
                          isDisabled={entryPendingRemoval === entry.post.id}
                          size="sm"
                          variant="ghost"
                          onPress={() => handleRemoveHistoryEntry(entry.post.id)}
                        >
                          <TrashBin aria-hidden="true" className="size-4" />
                        </Button>
                        <Tooltip.Content>Remove from history</Tooltip.Content>
                      </Tooltip>
                    </div>
                    <div className="text-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span>{formatDate(entry.lastReadAt)}</span>
                      <span>{entry.progressPercent}% read</span>
                      {entry.post.category?.name ? <span>{entry.post.category.name}</span> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {history.data && history.data.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-4">
              <Typography color="muted" type="body-xs">
                Page {historyPage + 1} of {history.data.totalPages}
              </Typography>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={historyPage === 0}
                  onPress={() => setHistoryPage((page) => Math.max(0, page - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={historyPage >= history.data.totalPages - 1}
                  onPress={() => setHistoryPage((page) => page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isClearHistoryOpen}
          onOpenChange={setIsClearHistoryOpen}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Clear reading history?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  This removes all saved reading activity. This action cannot be undone.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" size="sm" variant="tertiary">
                  Cancel
                </Button>
                <Button
                  isDisabled={isClearingHistory}
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

      <Modal>
        <Modal.Backdrop
          isOpen={isCollectionFormOpen}
          onOpenChange={setIsCollectionFormOpen}
          variant="blur"
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={handleCollectionSubmit}>
                <Modal.Header>
                  <Modal.Heading>
                    {collectionBeingEdited ? "Edit collection" : "Create collection"}
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  <TextField isRequired name="collection-name">
                    <Label>Name</Label>
                    <Input
                      maxLength={80}
                      placeholder="e.g. Design references"
                      value={collectionName}
                      onChange={(event) => setCollectionName(event.target.value)}
                    />
                    <FieldError />
                  </TextField>
                  <TextField name="collection-description">
                    <Label>Description</Label>
                    <TextArea
                      maxLength={300}
                      placeholder="What belongs in this collection?"
                      rows={3}
                      value={collectionDescription}
                      onChange={(event) => setCollectionDescription(event.target.value)}
                    />
                  </TextField>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" size="sm" variant="tertiary">
                    Cancel
                  </Button>
                  <Button
                    isPending={isCreatingCollection || isUpdatingCollection}
                    size="sm"
                    type="submit"
                  >
                    {collectionBeingEdited ? "Save changes" : "Create collection"}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isCollectionDeleteOpen}
          onOpenChange={setIsCollectionDeleteOpen}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete collection?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Delete{" "}
                  <strong className="text-foreground">{collectionPendingDeletion?.name}</strong>?
                  The articles will remain in your library, but this collection cannot be restored.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" size="sm" variant="tertiary">
                  Cancel
                </Button>
                <Button
                  isDisabled={!collectionPendingDeletion}
                  isPending={isDeletingCollection}
                  size="sm"
                  variant="danger"
                  onPress={handleDeleteCollection}
                >
                  Delete collection
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

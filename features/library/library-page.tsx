"use client";

import { EmptyState } from "@heroui-pro/react";
import {
  Button,
  Card,
  Checkbox,
  Chip,
  Link,
  ScrollShadow,
  Skeleton,
  Typography,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { useRetrieveFacetsQuery } from "@/lib/features/openapi";
import {
  type PostCollectionResponse,
  useClearHiddenRecommendationsMutation,
  useFollowCategoryMutation,
  useGetContentPreferencesQuery,
  useGetFavoritePostsQuery,
  useGetFollowingFeedQuery,
  useGetLibraryOverviewQuery,
  useGetPostCollectionsQuery,
  useHideRecommendationMutation,
  useUnfollowCategoryMutation,
} from "@/lib/features/library";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import { CollectionFormDialog, DeleteCollectionDialog } from "./collection-management-dialogs";
import { CollectionContents } from "./collection-contents";
import { FOLLOWING_PAGE_SIZE } from "./library-constants";
import {
  CollectionCard,
  EmptyLibrarySection,
  FavoriteCard,
  FollowingCard,
  LibrarySkeleton,
  ReadingCard,
  RecommendedCard,
} from "./library-cards";
import { ReadingHistorySection } from "./reading-history-section";

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

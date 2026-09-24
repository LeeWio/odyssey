"use client";

import { ActionBar, EmptyState } from "@heroui-pro/react";
import {
  Avatar,
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Link,
  Popover,
  ProgressBar,
  ProgressCircle,
  Separator,
  Skeleton,
  toast,
  Tooltip,
  Typography,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useDebouncedCallback } from "@mantine/hooks";
import { useMotionValueEvent, useScroll } from "motion/react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

import { CommentSheet } from "@/components/comment";
import { ArticleTypography } from "@/features/blog/reader/typography";
import { CreateCollectionDialog } from "@/features/library/create-collection-dialog";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import {
  useAddPostToCollectionMutation,
  useGetPostCollectionsQuery,
  useRecordReadingProgressMutation,
} from "@/lib/features/library";
import {
  type PostResponse,
  useFavoritePostMutation,
  useGetPublicPostBySlugQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/lib/features/post";
import { useAppSelector } from "@/lib/hooks";
import { commentDebug } from "@/lib/comment-debug";
import { getReadingPositionId } from "@/lib/reading-position";

import { ArticleSidebar } from "./article-sidebar";

const ArticleBodyReader = dynamic(
  () =>
    import("@/features/blog/reader/article-body-reader").then((mod) => ({
      default: mod.ArticleBodyReader,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-3 py-6" aria-hidden>
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-10/12 rounded" />
        <Skeleton className="h-4 w-9/12 rounded" />
        <Skeleton className="h-4 w-8/12 rounded" />
      </div>
    ),
  }
);

interface SinglePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface OptimisticLikeState {
  postId: number;
  isLiked: boolean;
  likesCount: number;
}

interface OptimisticFavoriteState {
  postId: number;
  isFavorited: boolean;
  favoritesCount: number;
}

function getReadingPositionAnchor(postId: number) {
  const headings = document.querySelectorAll<HTMLElement>(
    "[data-reading-content] h2[id], [data-reading-content] h3[id], [data-reading-content] h4[id]"
  );
  let anchor = "";

  for (const heading of headings) {
    if (heading.getBoundingClientRect().top > 160) break;
    anchor = heading.id;
  }

  return anchor ? `#${anchor}` : `article-${postId}`;
}

function formatArticleDate(value?: string | null) {
  if (!value) return "Recently published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getAuthorInitials(value?: string | null) {
  return (value?.trim() || "Odyssey")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getEstimatedReadingMinutes(article?: PostResponse) {
  const source = `${article?.content ?? ""} ${article?.summary ?? ""}`.trim();
  if (!source) return 4;

  const wordCount = source.split(/\s+/).filter(Boolean).length;
  const approximateCount = wordCount > 20 ? wordCount : Math.ceil(source.length / 700);

  return Math.max(1, Math.ceil(approximateCount / 225));
}

export default function SinglePage({ params }: SinglePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const { slug } = use(params);
  const [isActionBarOpen, setIsActionBarOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(
    () => searchParams.get("comments") === "1"
  );
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingProgressPostId, setReadingProgressPostId] = useState<number | null>(null);
  const [collectionPendingId, setCollectionPendingId] = useState<number | null>(null);
  const [collectionTarget, setCollectionTarget] = useState<{
    postId: number;
    slug: string;
    username: string | null;
  } | null>(null);
  const [optimisticLike, setOptimisticLike] = useState<OptimisticLikeState | null>(null);
  const [optimisticFavorite, setOptimisticFavorite] = useState<OptimisticFavoriteState | null>(
    null
  );
  const readingProgressRef = useRef({ postId: null as number | null, progress: 0 });
  const restoredPositionRef = useRef<string | null>(null);

  useEffect(() => {
    if (searchParams.get("comments") !== "1") return;
    router.replace(`/single/${slug}`, { scroll: false });
  }, [router, searchParams, slug]);

  const { scrollY, scrollYProgress } = useScroll();
  const { currentData: article, isFetching, isUninitialized } = useGetPublicPostBySlugQuery(slug);

  const isLoading = (isFetching || isUninitialized) && !article;
  const isUnavailable = !isLoading && !article;

  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();
  const [favoritePost, { isLoading: isFavoriting }] = useFavoritePostMutation();
  const [recordReadingProgress] = useRecordReadingProgressMutation();
  const { data: collections = [], isLoading: isLoadingCollections } = useGetPostCollectionsQuery(
    undefined,
    { skip: !isAuthenticated }
  );
  const [addPostToCollection] = useAddPostToCollectionMutation();
  const postId = article?.id;
  const serverIsLiked = article?.isLiked || false;
  const serverLikesCount = article?.likesCount || 0;
  const serverIsFavorited = article?.isFavorited || false;
  const serverFavoritesCount = article?.favoritesCount || 0;
  const currentOptimisticLike = optimisticLike?.postId === postId ? optimisticLike : null;
  const currentOptimisticFavorite =
    optimisticFavorite?.postId === postId ? optimisticFavorite : null;

  useEffect(() => {
    if (!article?.content || !postId) return;

    const targetId = getReadingPositionId(window.location.hash);
    if (!targetId) return;

    const restoreKey = `${postId}:${targetId}`;
    if (restoredPositionRef.current === restoreKey) return;

    let cancelled = false;
    let attempts = 0;
    let timer: number | null = null;

    const tryRestore = () => {
      if (cancelled) return;
      const target = document.getElementById(targetId);
      if (!target || !target.closest("[data-reading-content]")) {
        attempts += 1;
        if (attempts < 40) {
          timer = window.setTimeout(tryRestore, 50);
        }
        return;
      }

      restoredPositionRef.current = restoreKey;
      target.setAttribute("tabindex", "-1");
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      target.focus({ preventScroll: true });
    };

    timer = window.setTimeout(tryRestore, 0);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [article?.content, postId]);

  const isLiked = currentOptimisticLike?.isLiked ?? serverIsLiked;
  const likesCount = currentOptimisticLike?.likesCount ?? serverLikesCount;
  const isFavorited = currentOptimisticFavorite?.isFavorited ?? serverIsFavorited;

  const revealWhenScrollSettles = useDebouncedCallback((latestScrollY: number) => {
    setIsActionBarOpen(latestScrollY > 160);
  }, 700);

  useMotionValueEvent(scrollY, "change", (latestScrollY) => {
    if (isCommentSheetOpen) {
      commentDebug("page:scroll-ignored", { latestScrollY, reason: "comment-sheet-open" });
      return;
    }

    const previousScrollY = scrollY.getPrevious() ?? 0;
    const isPastArticleHeader = latestScrollY > 160;
    const isScrollingUp = latestScrollY < previousScrollY;

    setIsActionBarOpen(isPastArticleHeader && isScrollingUp);
    revealWhenScrollSettles(latestScrollY);
  });

  useMotionValueEvent(scrollYProgress, "change", (latestProgress) => {
    if (isCommentSheetOpen) {
      commentDebug("page:progress-ignored", { latestProgress, reason: "comment-sheet-open" });
      return;
    }

    setReadingProgress(Math.round(latestProgress * 100));
  });

  useEffect(() => {
    commentDebug("page:comment-sheet-state", { postId, isCommentSheetOpen });
  }, [isCommentSheetOpen, postId]);

  useEffect(() => () => revealWhenScrollSettles.cancel(), [revealWhenScrollSettles]);

  useEffect(() => {
    if (readingProgressRef.current.postId === postId) return;
    readingProgressRef.current = { postId: postId ?? null, progress: 0 };
    setReadingProgress(0);
    setReadingProgressPostId(postId ?? null);
  }, [postId]);

  useEffect(() => {
    if (!isAuthenticated || !postId || readingProgressPostId !== postId || readingProgress < 10)
      return;

    const progress = readingProgress === 100 ? 100 : Math.floor(readingProgress / 10) * 10;
    if (progress <= readingProgressRef.current.progress) return;

    readingProgressRef.current.progress = progress;
    void recordReadingProgress({
      postId,
      body: {
        positionAnchor: getReadingPositionAnchor(postId),
        progressPercent: progress,
      },
    })
      .unwrap()
      .catch(() => undefined);
  }, [isAuthenticated, postId, readingProgress, readingProgressPostId, recordReadingProgress]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Article link copied.");
    } catch {
      toast.danger("Unable to copy article link.");
    }
  };

  const handleLike = async () => {
    if (!postId) return;

    const wasLiked = isLiked;
    const nextLiked = !wasLiked;
    const previousLikesCount = likesCount;
    const nextLikesCount = nextLiked ? previousLikesCount + 1 : Math.max(0, previousLikesCount - 1);

    setOptimisticLike({ postId, isLiked: nextLiked, likesCount: nextLikesCount });

    try {
      if (wasLiked) {
        await unlikePost(postId).unwrap();
      } else {
        await likePost(postId).unwrap();
      }
    } catch {
      setOptimisticLike({ postId, isLiked: wasLiked, likesCount: previousLikesCount });
      toast.danger("Please log in to like this article.");
    }
  };

  const handleFavorite = async () => {
    if (!postId || isFavorited) return;

    setOptimisticFavorite({ postId, isFavorited: true, favoritesCount: 0 });

    try {
      await favoritePost(postId).unwrap();
      toast.success("Saved for later.");
    } catch {
      setOptimisticFavorite({ postId, isFavorited: false, favoritesCount: 0 });
      toast.danger("Please log in to save this article.");
    }
  };

  const handleAddToCollection = async (collectionId: number) => {
    if (!postId) return;

    setCollectionPendingId(collectionId);
    try {
      await addPostToCollection({ collectionId, postId }).unwrap();
    } catch {
      // The mutation displays its own failure toast.
    } finally {
      setCollectionPendingId(null);
    }
  };

  const openCreateCollection = () => {
    if (postId && isAuthenticated) setCollectionTarget({ postId, slug, username });
  };

  if (isUnavailable) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center px-6">
        <EmptyState className="max-w-md">
          <EmptyState.Header>
            <EmptyState.Title>Article not found</EmptyState.Title>
            <EmptyState.Description>
              This post could not be found, or it has not been published yet.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button size="sm" variant="secondary" onPress={() => router.push("/single")}>
              Back to journal
            </Button>
          </EmptyState.Content>
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <ProgressBar
        aria-label="Article reading progress"
        className="fixed inset-x-0 top-0 z-[70]"
        color="accent"
        maxValue={100}
        size="sm"
        value={readingProgress}
      >
        <ProgressBar.Track className="rounded-none">
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>

      <div className="grid w-full grid-cols-1 items-start gap-12 px-6 pt-28 pb-28 sm:px-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16 lg:px-14 xl:px-20">
        <article
          id={postId ? `article-${postId}` : undefined}
          className="w-full min-w-0"
          data-reading-content
        >
          {isLoading || !article ? (
            <div aria-busy="true" aria-label="Loading article" className="flex flex-col gap-6">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-14 w-11/12 rounded-lg" />
              <Skeleton className="h-14 w-3/4 rounded-lg" />
              <Skeleton className="h-5 w-full rounded-md" />
              <div className="flex flex-col gap-3 pt-8">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-11/12 rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </div>
            </div>
          ) : (
            <>
              <header className="flex flex-col gap-6 pb-10">
                <Breadcrumbs>
                  <BreadcrumbsItem href="/single">Journal</BreadcrumbsItem>
                  {article.series ? (
                    <BreadcrumbsItem href={`/columns/${article.series.slug}`}>
                      {article.series.name}
                    </BreadcrumbsItem>
                  ) : null}
                  <BreadcrumbsItem>{article.category?.name || "Essay"}</BreadcrumbsItem>
                </Breadcrumbs>

                <Typography
                  className="text-4xl leading-[1.08] text-balance sm:text-5xl"
                  type="h1"
                  weight="semibold"
                >
                  {article.title}
                </Typography>

                {article.summary ? (
                  <Typography className="text-lg leading-8 text-balance" color="muted">
                    {article.summary}
                  </Typography>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar size="sm">
                      {article.authorAvatar ? (
                        <Avatar.Image
                          alt={article.authorName || "Odyssey"}
                          src={article.authorAvatar}
                        />
                      ) : null}
                      <Avatar.Fallback>{getAuthorInitials(article.authorName)}</Avatar.Fallback>
                    </Avatar>
                    <Typography type="body-sm" weight="medium">
                      {article.authorName || "Odyssey"}
                    </Typography>
                  </div>
                  <Typography color="muted" type="body-sm">
                    {formatArticleDate(article.createdAt)}
                  </Typography>
                  <Typography className="tabular-nums" color="muted" type="body-sm">
                    {getEstimatedReadingMinutes(article)} min read
                  </Typography>
                </div>
              </header>

              <ArticleTypography>
                <ArticleBodyReader
                  content={article.content}
                  contentKey={article.content}
                  contentType={article.contentType}
                />
              </ArticleTypography>

              {article.tags?.length ? (
                <ul className="mt-10 flex flex-wrap gap-x-4 gap-y-2">
                  {article.tags.map((tag) => (
                    <li key={tag.id}>
                      <Link
                        className="text-muted text-sm no-underline"
                        href={`/explore?tag=${tag.id}`}
                      >
                        {tag.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {article.series && (article.navigation?.prev || article.navigation?.next) ? (
                <nav aria-label={`${article.series.name} column navigation`} className="mt-16">
                  <Separator className="mb-8" />
                  <Typography color="muted" type="body-sm">
                    {article.series.name}
                  </Typography>
                  <div className="mt-4 grid gap-6 sm:grid-cols-2">
                    {article.navigation.prev ? (
                      <Link
                        className="flex flex-col gap-1 no-underline"
                        href={`/single/${article.navigation.prev.slug}`}
                      >
                        <span className="text-muted text-xs">Previous</span>
                        <span className="text-foreground line-clamp-2 leading-6">
                          {article.navigation.prev.title}
                        </span>
                      </Link>
                    ) : (
                      <span />
                    )}
                    {article.navigation.next ? (
                      <Link
                        className="flex flex-col gap-1 no-underline sm:items-end sm:text-right"
                        href={`/single/${article.navigation.next.slug}`}
                      >
                        <span className="text-muted text-xs">Next</span>
                        <span className="text-foreground line-clamp-2 leading-6">
                          {article.navigation.next.title}
                        </span>
                      </Link>
                    ) : null}
                  </div>
                </nav>
              ) : null}
            </>
          )}
        </article>

        <div className="hidden lg:block">
          <ArticleSidebar slug={slug} />
        </div>

        <ActionBar isOpen={isActionBarOpen} aria-label="Article controls">
          <ActionBar.Prefix>
            <Tooltip delay={100}>
              <Button
                isIconOnly
                aria-label="Back"
                size="sm"
                variant="ghost"
                onPress={() => router.back()}
              >
                <Icon className="size-4" icon="gravity-ui:arrow-left" />
              </Button>
              <Tooltip.Content>Back</Tooltip.Content>
            </Tooltip>
          </ActionBar.Prefix>

          <Separator orientation="vertical" />

          <ActionBar.Content>
            <Button
              aria-label={isLiked ? "Unlike article" : "Like article"}
              isDisabled={!postId}
              isPending={isLiking || isUnliking}
              size="sm"
              variant={isLiked ? "danger-soft" : "ghost"}
              onPress={handleLike}
            >
              <Icon icon={isLiked ? "gravity-ui:heart-fill" : "gravity-ui:heart"} />
              <span className="tabular-nums">{likesCount}</span>
            </Button>

            <Tooltip delay={100}>
              <Button
                isIconOnly
                aria-label={isFavorited ? "Saved for later" : "Save for later"}
                isDisabled={!postId || isFavorited}
                isPending={isFavoriting}
                size="sm"
                variant={isFavorited ? "secondary" : "ghost"}
                onPress={handleFavorite}
              >
                <Icon icon={isFavorited ? "gravity-ui:bookmark-fill" : "gravity-ui:bookmark"} />
              </Button>
              <Tooltip.Content>{isFavorited ? "Saved" : "Save for later"}</Tooltip.Content>
            </Tooltip>

            <Tooltip delay={100}>
              <Button
                isIconOnly
                aria-label="Open comments"
                isDisabled={!postId}
                size="sm"
                variant="ghost"
                onPress={() => setIsCommentSheetOpen(true)}
              >
                <Icon icon="gravity-ui:comment" />
              </Button>
              <Tooltip.Content>Comments</Tooltip.Content>
            </Tooltip>

            <Popover>
              <Button aria-label="More article actions" size="sm" variant="ghost">
                <Icon className="size-4" icon="gravity-ui:ellipsis" />
              </Button>
              <Popover.Content placement="top">
                <Popover.Dialog>
                  <Popover.Heading>More actions</Popover.Heading>
                  <div className="mt-3 flex flex-col gap-1">
                    <Button fullWidth variant="ghost" onPress={handleShare}>
                      Copy link
                    </Button>
                    {isAuthenticated ? (
                      <>
                        <Separator className="my-1" />
                        <Typography className="px-2 py-1" color="muted" type="body-xs">
                          Save to collection
                        </Typography>
                        {isLoadingCollections ? (
                          <Typography className="px-2 py-2" color="muted" type="body-sm">
                            Loading collections
                          </Typography>
                        ) : (
                          <>
                            <Button fullWidth variant="ghost" onPress={openCreateCollection}>
                              {collections.length > 0 ? "New collection" : "Create collection"}
                            </Button>
                            {collections.slice(0, 5).map((collection) => (
                              <Button
                                key={collection.id}
                                fullWidth
                                isPending={collectionPendingId === collection.id}
                                variant="ghost"
                                onPress={() => handleAddToCollection(collection.id)}
                              >
                                <span className="min-w-0 flex-1 truncate text-left">
                                  {collection.name}
                                </span>
                                <span className="text-muted text-xs tabular-nums">
                                  {collection.itemCount}
                                </span>
                              </Button>
                            ))}
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </ActionBar.Content>

          <Separator orientation="vertical" />

          <ActionBar.Suffix>
            <Tooltip delay={100}>
              <Button
                isIconOnly
                aria-label={`Reading progress ${readingProgress} percent. Scroll to top`}
                size="sm"
                variant="ghost"
                onPress={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                      ? "auto"
                      : "smooth",
                  })
                }
              >
                <ProgressCircle
                  aria-hidden="true"
                  className="pointer-events-none"
                  color="default"
                  maxValue={100}
                  size="sm"
                  value={readingProgress}
                >
                  <ProgressCircle.Track>
                    <ProgressCircle.TrackCircle />
                    <ProgressCircle.FillCircle />
                  </ProgressCircle.Track>
                </ProgressCircle>
              </Button>
              <Tooltip.Content>{readingProgress}% read</Tooltip.Content>
            </Tooltip>
          </ActionBar.Suffix>
        </ActionBar>

        {collectionTarget &&
        isAuthenticated &&
        collectionTarget.slug === slug &&
        collectionTarget.postId === postId &&
        collectionTarget.username === username ? (
          <CreateCollectionDialog
            key={`${slug}:${postId}:${username}`}
            postId={collectionTarget.postId}
            onClose={() => setCollectionTarget(null)}
          />
        ) : null}

        {postId ? (
          <CommentSheet
            key={postId}
            isOpen={isCommentSheetOpen}
            postId={postId}
            onOpenChange={setIsCommentSheetOpen}
          />
        ) : null}
      </div>
    </>
  );
}

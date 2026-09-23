"use client";

import {
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Chip,
  Link,
  Popover,
  ProgressBar,
  ProgressCircle,
  Tooltip,
  Skeleton,
  toast,
  Typography,
  Separator,
  Avatar,
  Card,
} from "@heroui/react";
import { ActionBar, EmptyState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useDebouncedCallback } from "@mantine/hooks";
import { useMotionValueEvent, useScroll } from "motion/react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { CommentSheet } from "@/components/comment";
import { ArticleTypography } from "@/features/blog/reader/typography";
import {
  type PostResponse,
  useFavoritePostMutation,
  useGetPublicPostBySlugQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/lib/features/post";
import { FluidBackdrop } from "@/components/background/fluid-backdrop";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import {
  useAddPostToCollectionMutation,
  useGetPostCollectionsQuery,
  useRecordReadingProgressMutation,
} from "@/lib/features/library";
import { getReadingPositionId } from "@/lib/reading-position";
import { commentDebug } from "@/lib/comment-debug";
import { useAppSelector } from "@/lib/hooks";
import { ArticleSidebar } from "./article-sidebar";
import { CreateCollectionDialog } from "@/features/library/create-collection-dialog";

const ArticleBodyReader = dynamic(
  () =>
    import("@/features/blog/reader/article-body-reader").then((mod) => ({
      default: mod.ArticleBodyReader,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 py-6" aria-hidden>
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
  const {
    currentData: serverArticle,
    isFetching,
    isUninitialized,
  } = useGetPublicPostBySlugQuery(slug);

  const article = serverArticle;
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
  const favoritesCount = currentOptimisticFavorite?.favoritesCount ?? serverFavoritesCount;

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

    const previousFavoritesCount = favoritesCount;

    setOptimisticFavorite({
      postId,
      isFavorited: true,
      favoritesCount: previousFavoritesCount + 1,
    });

    try {
      await favoritePost(postId).unwrap();
      toast.success("Saved for later.");
    } catch {
      setOptimisticFavorite({
        postId,
        isFavorited: false,
        favoritesCount: previousFavoritesCount,
      });
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
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <EmptyState className="border-border rounded-2xl border border-dashed p-6">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="lucide:book-x" className="text-muted size-6" />
              </EmptyState.Media>
              <EmptyState.Title>Article not found</EmptyState.Title>
              <EmptyState.Description>
                This post could not be found, or it has not been published yet.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button size="sm" variant="secondary" onPress={() => router.push("/blog")}>
                Back to Journal
              </Button>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <>
      <FluidBackdrop scrollYProgress={scrollYProgress} />

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

      <header className="relative w-full px-5 pt-28 pb-12 sm:px-8 sm:pt-32 lg:px-12 lg:pb-16">
        <div className="mx-auto w-full max-w-6xl">
          {isLoading || !article ? (
            <Card variant="transparent" className="gap-8 p-0">
              <Card.Header className="gap-6 p-0">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <div className="flex w-full flex-col gap-3">
                  <Skeleton className="h-14 w-11/12 rounded-xl" />
                  <Skeleton className="h-14 w-4/5 rounded-xl" />
                </div>
                <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
                <Skeleton className="h-5 w-4/5 max-w-xl rounded-lg" />
              </Card.Header>
              <Card.Footer className="flex items-center gap-3 p-0">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-9 w-40 rounded-lg" />
              </Card.Footer>
            </Card>
          ) : (
            <div className="flex flex-col gap-8">
              <Breadcrumbs className="text-muted text-xs font-medium">
                <BreadcrumbsItem className="text-muted" href="/single">
                  <span className="text-muted">Journal</span>
                </BreadcrumbsItem>
                {article.series ? (
                  <BreadcrumbsItem className="text-muted" href={`/columns/${article.series.slug}`}>
                    <span className="text-muted">{article.series.name}</span>
                  </BreadcrumbsItem>
                ) : null}
                <BreadcrumbsItem className="text-muted">
                  <span className="text-muted">{article.category?.name || "Uncategorized"}</span>
                </BreadcrumbsItem>
              </Breadcrumbs>

              <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16">
                <div className="flex min-w-0 flex-col items-start gap-6">
                  <div className="flex flex-wrap gap-2">
                    <Chip color="accent" size="sm" variant="soft">
                      {article.category?.name || "Journal"}
                    </Chip>
                    <Chip size="sm" variant="tertiary">
                      <Icon aria-hidden="true" icon="lucide:clock-3" className="size-3.5" />
                      {getEstimatedReadingMinutes(article)} min read
                    </Chip>
                    {article.seriesOrder != null ? (
                      <Chip size="sm" variant="tertiary">
                        Essay {article.seriesOrder + 1}
                      </Chip>
                    ) : null}
                  </div>

                  <Typography
                    type="h1"
                    className="text-foreground max-w-4xl text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.98] font-bold text-balance"
                  >
                    {article.title}
                  </Typography>

                  {article.summary ? (
                    <Typography
                      type="body"
                      className="text-muted max-w-2xl text-lg leading-8 font-normal text-balance sm:text-xl"
                    >
                      {article.summary}
                    </Typography>
                  ) : null}
                </div>

                <Card variant="secondary" className="gap-5 p-5">
                  <Card.Header className="flex-row items-center gap-3 p-0">
                    <Avatar size="md" variant="soft">
                      {article.authorAvatar ? (
                        <Avatar.Image
                          alt={article.authorName || "Odyssey"}
                          src={article.authorAvatar}
                        />
                      ) : null}
                      <Avatar.Fallback>{getAuthorInitials(article.authorName)}</Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Card.Title className="truncate text-sm">
                        {article.authorName || "Odyssey"}
                      </Card.Title>
                      <Card.Description className="text-xs tabular-nums">
                        {formatArticleDate(article.createdAt)}
                      </Card.Description>
                    </div>
                  </Card.Header>
                  <Card.Content className="flex flex-wrap gap-x-4 gap-y-2 p-0">
                    <Typography
                      className="flex items-center gap-1.5 tabular-nums"
                      color="muted"
                      type="body-xs"
                    >
                      <Icon aria-hidden="true" icon="gravity-ui:eye" className="size-3.5" />
                      {article.views.toLocaleString("en-US")}
                    </Typography>
                    <Typography
                      className="flex items-center gap-1.5 tabular-nums"
                      color="muted"
                      type="body-xs"
                    >
                      <Icon aria-hidden="true" icon="gravity-ui:heart" className="size-3.5" />
                      {likesCount.toLocaleString("en-US")}
                    </Typography>
                    <Typography
                      className="flex items-center gap-1.5 tabular-nums"
                      color="muted"
                      type="body-xs"
                    >
                      <Icon aria-hidden="true" icon="lucide:bookmark" className="size-3.5" />
                      {favoritesCount.toLocaleString("en-US")}
                    </Typography>
                  </Card.Content>
                  <Card.Footer className="gap-2 p-0">
                    <Button
                      size="sm"
                      variant={isFavorited ? "secondary" : "outline"}
                      isDisabled={!postId || isFavorited}
                      isPending={isFavoriting}
                      onPress={handleFavorite}
                    >
                      <Icon
                        aria-hidden="true"
                        icon={isFavorited ? "lucide:bookmark-check" : "lucide:bookmark"}
                        className="size-4"
                      />
                      {isFavorited ? "Saved" : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onPress={handleShare}>
                      <Icon aria-hidden="true" icon="lucide:share-2" className="size-4" />
                      Share
                    </Button>
                  </Card.Footer>
                </Card>
              </div>

              {article.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Chip key={tag.id} size="sm" variant="soft">
                      {tag.name}
                    </Chip>
                  ))}
                </div>
              ) : null}

              <Separator />
            </div>
          )}
        </div>
      </header>

      {/* Main Grid Body */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 content-start justify-center gap-8 px-4 py-12 md:px-6 lg:grid-cols-[260px_minmax(0,760px)] lg:px-8 xl:grid-cols-[280px_minmax(0,760px)] xl:gap-12 2xl:gap-16 2xl:px-12">
        <ArticleSidebar slug={slug} />

        <article
          id={postId ? `article-${postId}` : undefined}
          data-reading-content
          className="mx-auto w-full max-w-[760px] min-w-0"
        >
          <section className="mx-auto max-w-190 py-0">
            {isLoading || !article ? (
              <Card aria-label="Loading article" variant="transparent" className="gap-8 p-0">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Card.Content key={index} className="flex flex-col gap-3 p-0">
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-4 w-11/12 rounded-lg" />
                    <Skeleton className="h-4 w-4/5 rounded-lg" />
                  </Card.Content>
                ))}
              </Card>
            ) : (
              <ArticleTypography>
                <ArticleBodyReader
                  content={article.content}
                  contentType={article.contentType}
                  contentKey={article.content}
                />
              </ArticleTypography>
            )}
          </section>

          {article?.series ? (
            <nav aria-label={`${article.series.name} column navigation`} className="mt-16">
              <Separator className="mb-8" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Typography color="muted" type="body-xs" weight="medium">
                    Continue this column
                  </Typography>
                  <Link
                    className="text-foreground mt-1 inline-flex items-center gap-2 text-lg font-semibold no-underline"
                    href={`/columns/${article.series.slug}`}
                  >
                    {article.series.name}
                    <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
                  </Link>
                </div>
                {article.seriesOrder != null ? (
                  <Typography className="font-mono tabular-nums" color="muted" type="body-xs">
                    Essay {article.seriesOrder + 1}
                  </Typography>
                ) : null}
              </div>

              {article.navigation?.prev || article.navigation?.next ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {article.navigation.prev ? (
                    <Link
                      className="h-full no-underline"
                      href={`/single/${article.navigation.prev.slug}`}
                    >
                      <Card variant="secondary" className="h-full min-h-28">
                        <Card.Header className="gap-2">
                          <Card.Description className="flex items-center gap-1.5 text-xs">
                            <Icon
                              aria-hidden="true"
                              icon="lucide:arrow-left"
                              className="size-3.5"
                            />
                            Previous essay
                          </Card.Description>
                          <Card.Title className="line-clamp-2 text-sm">
                            {article.navigation.prev.title}
                          </Card.Title>
                        </Card.Header>
                      </Card>
                    </Link>
                  ) : (
                    <div aria-hidden="true" className="hidden sm:block" />
                  )}
                  {article.navigation.next ? (
                    <Link
                      className="h-full no-underline"
                      href={`/single/${article.navigation.next.slug}`}
                    >
                      <Card variant="secondary" className="h-full min-h-28">
                        <Card.Header className="items-end gap-2 text-right">
                          <Card.Description className="flex items-center gap-1.5 text-xs">
                            Next essay
                            <Icon
                              aria-hidden="true"
                              icon="lucide:arrow-right"
                              className="size-3.5"
                            />
                          </Card.Description>
                          <Card.Title className="line-clamp-2 text-sm">
                            {article.navigation.next.title}
                          </Card.Title>
                        </Card.Header>
                      </Card>
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </nav>
          ) : null}
        </article>

        <ActionBar isOpen={isActionBarOpen} aria-label="Article controls">
          <ActionBar.Prefix>
            <Tooltip delay={100}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Back"
                onPress={() => router.back()}
              >
                <Icon icon="lucide:arrow-left" className="size-4" />
              </Button>
              <Tooltip.Content>Back</Tooltip.Content>
            </Tooltip>
          </ActionBar.Prefix>

          <Separator orientation="vertical" />

          <ActionBar.Content>
            <Button
              size="sm"
              variant={isLiked ? "danger" : "ghost"}
              aria-label={isLiked ? "Unlike article" : "Like article"}
              isDisabled={!postId}
              isPending={isLiking || isUnliking}
              onPress={handleLike}
            >
              <Icon icon="gravity-ui:heart-fill" />
              <span>{likesCount}</span>
            </Button>

            <Tooltip delay={100}>
              <Button
                isIconOnly
                size="sm"
                variant={isFavorited ? "secondary" : "ghost"}
                aria-label={isFavorited ? "Saved for later" : "Save for later"}
                isDisabled={!postId || isFavorited}
                isPending={isFavoriting}
                onPress={handleFavorite}
              >
                <Icon icon={isFavorited ? "lucide:bookmark-check" : "lucide:bookmark"} />
              </Button>
              <Tooltip.Content>{isFavorited ? "Saved" : "Save for later"}</Tooltip.Content>
            </Tooltip>

            <Tooltip delay={100}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Open comments"
                isDisabled={!postId}
                onPress={() => setIsCommentSheetOpen(true)}
              >
                <Icon icon="gravity-ui:comments" />
              </Button>
              <Tooltip.Content>Comments</Tooltip.Content>
            </Tooltip>

            <Popover>
              <Button size="sm" variant="ghost" aria-label="More article actions">
                <Icon icon="lucide:ellipsis" className="size-4" />
              </Button>
              <Popover.Content placement="top">
                <Popover.Dialog>
                  <Popover.Heading>More Actions</Popover.Heading>
                  <div className="mt-3 flex flex-col gap-2">
                    <Button fullWidth variant="ghost" onPress={handleShare}>
                      <Icon icon="lucide:share-2" className="size-4" />
                      Share
                    </Button>
                    <Button
                      fullWidth
                      variant="ghost"
                      isDisabled={!postId}
                      onPress={() => setIsCommentSheetOpen(true)}
                    >
                      <Icon icon="lucide:message-square" className="size-4" />
                      Comments
                    </Button>
                    {isAuthenticated ? (
                      <>
                        <Separator className="my-1" />
                        <Typography
                          className="px-2 pt-1"
                          color="muted"
                          type="body-xs"
                          weight="medium"
                        >
                          Save to collection
                        </Typography>
                        {isLoadingCollections ? (
                          <Typography className="px-2 py-2" color="muted" type="body-sm">
                            Loading collections...
                          </Typography>
                        ) : collections.length > 0 ? (
                          <>
                            <Button fullWidth variant="ghost" onPress={openCreateCollection}>
                              <Icon icon="lucide:folder-plus" className="size-4" />
                              New collection
                            </Button>
                            {collections.slice(0, 5).map((collection) => (
                              <Button
                                key={collection.id}
                                fullWidth
                                isPending={collectionPendingId === collection.id}
                                variant="ghost"
                                onPress={() => handleAddToCollection(collection.id)}
                              >
                                <Icon icon="lucide:folder-plus" className="size-4" />
                                <span className="min-w-0 flex-1 truncate text-left">
                                  {collection.name}
                                </span>
                                <span className="text-muted text-xs tabular-nums">
                                  {collection.itemCount}
                                </span>
                              </Button>
                            ))}
                            <Button
                              fullWidth
                              variant="ghost"
                              onPress={() => router.push("/library")}
                            >
                              <Icon icon="lucide:folders" className="size-4" />
                              Manage collections
                            </Button>
                          </>
                        ) : (
                          <Button fullWidth variant="ghost" onPress={openCreateCollection}>
                            <Icon icon="lucide:folder-plus" className="size-4" />
                            Create collection
                          </Button>
                        )}
                      </>
                    ) : null}
                    <Button
                      fullWidth
                      variant="ghost"
                      onPress={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                      <Icon icon="lucide:arrow-up" className="size-4" />
                      Back to Top
                    </Button>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </ActionBar.Content>

          <Separator orientation="vertical" />

          <ActionBar.Suffix>
            <Tooltip delay={100}>
              <Tooltip.Trigger className="flex flex-row">
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={`Reading progress ${readingProgress}%. Scroll to top`}
                  onPress={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <ProgressCircle
                    className="pointer-events-none"
                    color="default"
                    maxValue={100}
                    size="sm"
                    value={readingProgress}
                    aria-hidden="true"
                  >
                    <ProgressCircle.Track>
                      <ProgressCircle.TrackCircle />
                      <ProgressCircle.FillCircle />
                    </ProgressCircle.Track>
                  </ProgressCircle>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>{readingProgress}% , back to top</Tooltip.Content>
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

function getEstimatedReadingMinutes(article?: PostResponse) {
  const source = `${article?.content ?? ""} ${article?.summary ?? ""}`.trim();

  if (!source) return 4;

  const wordCount = source.split(/\s+/).filter(Boolean).length;
  const approximateCount = wordCount > 20 ? wordCount : Math.ceil(source.length / 700);

  return Math.max(1, Math.ceil(approximateCount / 225));
}

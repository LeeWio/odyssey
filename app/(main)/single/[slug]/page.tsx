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
import { useLocale, useTranslations } from "next-intl";
import { use, useEffect, useRef, useState } from "react";

import { CommentSheet } from "@/components/comment";
import { ArticleOutline } from "@/features/blog/reader/article-outline";
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

import { ArticleContext } from "./article-sidebar";

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

function formatArticleDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
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
  const t = useTranslations("Article");
  const locale = useLocale();
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
      toast.success(t("linkCopied"));
    } catch {
      toast.danger(t("linkCopyFailed"));
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
      toast.danger(t("loginToLike"));
    }
  };

  const handleFavorite = async () => {
    if (!postId || isFavorited) return;

    setOptimisticFavorite({ postId, isFavorited: true, favoritesCount: 0 });

    try {
      await favoritePost(postId).unwrap();
      toast.success(t("savedToast"));
    } catch {
      setOptimisticFavorite({ postId, isFavorited: false, favoritesCount: 0 });
      toast.danger(t("loginToSave"));
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
            <EmptyState.Title>{t("notFoundTitle")}</EmptyState.Title>
            <EmptyState.Description>{t("notFoundDescription")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button size="sm" variant="secondary" onPress={() => router.push("/single")}>
              {t("backToJournal")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <ProgressBar
        aria-label={t("readingProgress")}
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

      <div className="grid w-full grid-cols-1 items-start gap-x-10 gap-y-12 px-6 pt-28 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:px-8 xl:grid-cols-[14rem_minmax(0,1fr)_18rem] xl:px-10 2xl:px-14">
        <div className="sticky top-28 hidden self-start xl:block" id="article-outline-rail" />

        <article
          id={postId ? `article-${postId}` : undefined}
          className="order-1 w-full min-w-0 xl:order-none xl:max-w-[42rem]"
          data-reading-content
        >
          {isLoading || !article ? (
            <div aria-busy="true" aria-label={t("loading")} className="flex flex-col gap-6">
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
                  <BreadcrumbsItem href="/single">{t("journal")}</BreadcrumbsItem>
                  {article.series ? (
                    <BreadcrumbsItem href={`/columns/${article.series.slug}`}>
                      {article.series.name}
                    </BreadcrumbsItem>
                  ) : null}
                  <BreadcrumbsItem>{article.category?.name || t("essay")}</BreadcrumbsItem>
                </Breadcrumbs>

                {article.coverImage?.trim() ? (
                  // Cover hosts are not in next/image remotePatterns.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="aspect-[16/9] w-full rounded-2xl object-cover"
                    src={article.coverImage.trim()}
                  />
                ) : null}

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
                    {formatArticleDate(article.createdAt, locale, t("recentlyPublished"))}
                  </Typography>
                  {article.updatedAt && article.updatedAt !== article.createdAt ? (
                    <Typography color="muted" type="body-sm">
                      {t("updated", {
                        date: formatArticleDate(article.updatedAt, locale, t("recentlyPublished")),
                      })}
                    </Typography>
                  ) : null}
                  <Typography className="tabular-nums" color="muted" type="body-sm">
                    {t("minRead", { count: getEstimatedReadingMinutes(article) })}
                  </Typography>
                  <Typography className="tabular-nums" color="muted" type="body-sm">
                    {t("views", { count: article.views.toLocaleString(locale) })}
                  </Typography>
                </div>
              </header>

              <ArticleTypography>
                <ArticleBodyReader
                  content={article.content}
                  contentKey={article.content}
                  contentType={article.contentType}
                  outlineLabel={t("onThisPage")}
                  outlineRail={<ArticleOutline label={t("onThisPage")} variant="rail" />}
                  showTableOfContents={false}
                />
              </ArticleTypography>

              {article.series && (article.navigation?.prev || article.navigation?.next) ? (
                <nav
                  aria-label={t("columnNavigation", { name: article.series.name })}
                  className="mt-16"
                >
                  <Separator className="mb-8" />
                  <Link
                    className="text-foreground text-sm font-medium no-underline"
                    href={`/columns/${article.series.slug}`}
                  >
                    {t("partOfColumn", { name: article.series.name })}
                  </Link>
                  {article.series.description ? (
                    <Typography className="mt-2 max-w-xl" color="muted" type="body-sm">
                      {article.series.description}
                    </Typography>
                  ) : null}
                  {article.seriesOrder ? (
                    <Typography className="mt-2" color="muted" type="body-xs">
                      {t("installment", {
                        count: article.series.postsCount,
                        order: article.seriesOrder,
                      })}
                    </Typography>
                  ) : null}
                  <div className="mt-4 grid gap-6 sm:grid-cols-2">
                    {article.navigation.prev ? (
                      <Link
                        className="flex flex-col gap-1 no-underline"
                        href={`/single/${article.navigation.prev.slug}`}
                      >
                        <span className="text-muted text-xs">{t("previous")}</span>
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
                        <span className="text-muted text-xs">{t("next")}</span>
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

        {!isLoading && article ? (
          <ArticleContext
            article={article}
            readingMinutes={getEstimatedReadingMinutes(article)}
            slug={slug}
          />
        ) : (
          <div className="hidden lg:block" />
        )}

        <ActionBar isOpen={isActionBarOpen} aria-label={t("controls")}>
          <ActionBar.Prefix>
            <Tooltip delay={100}>
              <Button
                isIconOnly
                aria-label={t("back")}
                size="sm"
                variant="ghost"
                onPress={() => router.back()}
              >
                <Icon className="size-4" icon="gravity-ui:arrow-left" />
              </Button>
              <Tooltip.Content>{t("back")}</Tooltip.Content>
            </Tooltip>
          </ActionBar.Prefix>

          <Separator orientation="vertical" />

          <ActionBar.Content>
            <Button
              aria-label={isLiked ? t("unlike") : t("like")}
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
                aria-label={isFavorited ? t("savedForLater") : t("saveForLater")}
                isDisabled={!postId || isFavorited}
                isPending={isFavoriting}
                size="sm"
                variant={isFavorited ? "secondary" : "ghost"}
                onPress={handleFavorite}
              >
                <Icon icon={isFavorited ? "gravity-ui:bookmark-fill" : "gravity-ui:bookmark"} />
              </Button>
              <Tooltip.Content>{isFavorited ? t("saved") : t("saveForLater")}</Tooltip.Content>
            </Tooltip>

            <Tooltip delay={100}>
              <Button
                isIconOnly
                aria-label={t("openComments")}
                isDisabled={!postId}
                size="sm"
                variant="ghost"
                onPress={() => setIsCommentSheetOpen(true)}
              >
                <Icon icon="gravity-ui:comment" />
              </Button>
              <Tooltip.Content>{t("comments")}</Tooltip.Content>
            </Tooltip>

            <Popover>
              <Button aria-label={t("moreActions")} size="sm" variant="ghost">
                <Icon className="size-4" icon="gravity-ui:ellipsis" />
              </Button>
              <Popover.Content placement="top">
                <Popover.Dialog>
                  <Popover.Heading>{t("moreActionsTitle")}</Popover.Heading>
                  <div className="mt-3 flex flex-col gap-1">
                    <Button fullWidth variant="ghost" onPress={handleShare}>
                      {t("copyLink")}
                    </Button>
                    {isAuthenticated ? (
                      <>
                        <Separator className="my-1" />
                        <Typography className="px-2 py-1" color="muted" type="body-xs">
                          {t("saveToCollection")}
                        </Typography>
                        {isLoadingCollections ? (
                          <Typography className="px-2 py-2" color="muted" type="body-sm">
                            {t("loadingCollections")}
                          </Typography>
                        ) : (
                          <>
                            <Button fullWidth variant="ghost" onPress={openCreateCollection}>
                              {collections.length > 0 ? t("newCollection") : t("createCollection")}
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
                aria-label={t("scrollToTop", { progress: readingProgress })}
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
              <Tooltip.Content>{t("percentRead", { progress: readingProgress })}</Tooltip.Content>
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

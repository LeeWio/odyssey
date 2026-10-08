"use client";

import { ActionBar, EmptyState } from "@heroui-pro/react";
import {
  Avatar,
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Card,
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
import { useEffect, useRef, useState } from "react";

import { CommentSheet } from "@/components/comment";
import { siteConfig } from "@/config/site";
import { ArticleOutline } from "@/features/blog/reader/article-outline";
import { ArticleTypography } from "@/features/blog/reader/typography";
import { CreateCollectionDialog } from "@/features/library/create-collection-dialog";
import { ReadingListButton } from "@/features/library/reading-list-button";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import {
  useAddPostToCollectionMutation,
  useGetPostCollectionsQuery,
  useRecordReadingProgressMutation,
} from "@/lib/features/library";
import { useGetPublicColumnBySlugQuery } from "@/lib/features/column";
import {
  type PostResponse,
  useGetPublicPostBySlugQuery,
  useGetRelatedPostsQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/lib/features/post";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";
import { useAppSelector } from "@/lib/hooks";
import { commentDebug } from "@/lib/comment-debug";
import {
  clearPendingReadingProgress,
  getReadingPositionId,
  readPendingReadingProgress,
  writePendingReadingProgress,
} from "@/lib/reading-position";

import { ArticleContext, columnOrder } from "./article-sidebar";

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
  initialArticle: PostResponse | null;
  slug: string;
}

interface OptimisticLikeState {
  postId: number;
  isLiked: boolean;
  likesCount: number;
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

function ArticleDate({ value }: { value: string | null | undefined }) {
  const t = useTranslations("Article");
  const locale = useLocale();
  const label = formatArticleDate(value, locale, t("recentlyPublished"));
  const date = value ? new Date(value) : null;
  const valid = date && !Number.isNaN(date.getTime());

  if (!valid) {
    return (
      <Typography color="muted" type="body-sm">
        {label}
      </Typography>
    );
  }

  return (
    <Link
      className="text-muted text-sm no-underline"
      href={`/single/years/${date.getFullYear()}/${date.getMonth() + 1}`}
    >
      {label}
    </Link>
  );
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

function ArticleStructuredData({ article, slug }: { article: PostResponse; slug: string }) {
  const publishedAt = getPostPublishedAt(article);
  const articleUrl = `${siteConfig.url}/single/${encodeURIComponent(slug)}`;
  const breadcrumbs = [
    { name: "Journal", url: `${siteConfig.url}/single` },
    article.category?.name
      ? {
          name: article.category.name,
          url: article.category.slug
            ? `${siteConfig.url}/single/categories/${encodeURIComponent(article.category.slug)}`
            : `${siteConfig.url}/single/categories`,
        }
      : null,
    { name: article.title, url: articleUrl },
  ].filter((item): item is { name: string; url: string } => Boolean(item));
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${articleUrl}#article`,
        headline: article.title,
        description: article.summary || undefined,
        image: article.coverImage || undefined,
        datePublished: publishedAt,
        dateModified: article.updatedAt || publishedAt,
        mainEntityOfPage: articleUrl,
        author: {
          "@type": "Person",
          name: article.authorName || "Odyssey",
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        articleSection: article.category?.name || undefined,
        keywords:
          article.tags
            ?.map((tag) => tag.name)
            .filter(Boolean)
            .join(", ") || undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, position) => ({
          "@type": "ListItem",
          position: position + 1,
          name: item.name,
          item: item.url,
        })),
      },
    ],
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
      type="application/ld+json"
    />
  );
}

function ReadNext({ article }: { article: PostResponse }) {
  const t = useTranslations("Article");
  const related = useGetRelatedPostsQuery(article.slug);
  const next = (related.data ?? []).find((post) => post.slug && post.slug !== article.slug);
  if (!next?.slug) return null;

  return (
    <nav aria-label={t("readNext")} className="mt-16 flex flex-col gap-4">
      <Separator />
      <Card>
        <Card.Header>
          <Card.Description>{t("readNext")}</Card.Description>
          <Card.Title>
            <Link
              className="text-foreground line-clamp-2 no-underline"
              href={`/single/${next.slug}`}
            >
              {next.title}
            </Link>
          </Card.Title>
          {next.summary ? (
            <Card.Description className="line-clamp-3">{next.summary}</Card.Description>
          ) : null}
        </Card.Header>
      </Card>
    </nav>
  );
}

function ColumnInstallment({
  series,
  slug,
}: {
  series: NonNullable<PostResponse["series"]>;
  slug: string;
}) {
  const t = useTranslations("Article");
  const column = useGetPublicColumnBySlugQuery(series.slug);
  const order = columnOrder(column.data?.posts ?? [], slug) ?? undefined;
  if (!order) return null;

  return (
    <Typography color="muted" type="body-xs">
      {t("installment", { count: series.postsCount, order })}
    </Typography>
  );
}

function getEstimatedReadingMinutes(article?: PostResponse) {
  const source = `${article?.content ?? ""} ${article?.summary ?? ""}`.trim();
  if (!source) return 4;

  const wordCount = source.split(/\s+/).filter(Boolean).length;
  const approximateCount = wordCount > 20 ? wordCount : Math.ceil(source.length / 700);

  return Math.max(1, Math.ceil(approximateCount / 225));
}

export default function SinglePage({ initialArticle, slug }: SinglePageProps) {
  const t = useTranslations("Article");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
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
  const readingProgressRef = useRef({ postId: null as number | null, progress: 0 });
  const resumedProgressRef = useRef<number | null>(null);
  const progressToastRef = useRef<string | null>(null);
  const restoredPositionRef = useRef<string | null>(null);

  useEffect(() => {
    if (searchParams.get("comments") !== "1") return;
    router.replace(`/single/${slug}`, { scroll: false });
  }, [router, searchParams, slug]);

  const { scrollY, scrollYProgress } = useScroll();
  const {
    currentData: fetchedArticle,
    isFetching,
    isUninitialized,
  } = useGetPublicPostBySlugQuery(slug);
  const article = fetchedArticle ?? initialArticle;

  const isLoading = (isFetching || isUninitialized) && !article;
  const isUnavailable = !isLoading && !article;

  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();
  const [recordReadingProgress] = useRecordReadingProgressMutation();
  const { data: collections = [], isLoading: isLoadingCollections } = useGetPostCollectionsQuery(
    undefined,
    { skip: !isAuthenticated }
  );
  const [addPostToCollection] = useAddPostToCollectionMutation();
  const postId = article?.id;
  const serverIsLiked = article?.isLiked || false;
  const serverLikesCount = article?.likesCount || 0;
  const currentOptimisticLike = optimisticLike?.postId === postId ? optimisticLike : null;

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
  const isInReadingList = Boolean(article?.isInReadingList);

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
    const pending = postId ? readPendingReadingProgress(postId) : null;
    readingProgressRef.current = {
      postId: postId ?? null,
      progress: pending?.progressPercent ?? 0,
    };
    setReadingProgress(0);
    setReadingProgressPostId(postId ?? null);
    resumedProgressRef.current = pending?.progressPercent ?? null;
  }, [postId]);

  const saveReadingCheckpoint = (progress: number) => {
    if (!postId) return;
    const positionAnchor = getReadingPositionAnchor(postId);
    writePendingReadingProgress({ postId, progressPercent: progress, positionAnchor });
    void recordReadingProgress({
      postId,
      body: { positionAnchor, progressPercent: progress },
    })
      .unwrap()
      .then(() => {
        if (readingProgressRef.current.postId !== postId) return;
        if (readingProgressRef.current.progress !== progress) return;
        clearPendingReadingProgress(postId);
        resumedProgressRef.current = null;
        if (progressToastRef.current) {
          toast.close(progressToastRef.current);
          progressToastRef.current = null;
        }
      })
      .catch(() => {
        if (readingProgressRef.current.postId !== postId) return;
        if (progressToastRef.current) toast.close(progressToastRef.current);
        progressToastRef.current = toast.danger(t("progressSaveFailed"), {
          actionProps: {
            children: t("tryAgain"),
            onPress: () => saveReadingCheckpoint(readingProgressRef.current.progress),
          },
        });
      });
  };

  useEffect(() => {
    if (!isAuthenticated || !postId || readingProgressPostId !== postId) return;

    const resumed = resumedProgressRef.current;
    const progress =
      readingProgress >= 10
        ? readingProgress === 100
          ? 100
          : Math.floor(readingProgress / 10) * 10
        : 0;
    const checkpoint = resumed != null && resumed >= progress ? resumed : progress;
    if (checkpoint < 10 || checkpoint < readingProgressRef.current.progress) return;
    if (checkpoint === readingProgressRef.current.progress && resumed == null) return;

    resumedProgressRef.current = null;
    readingProgressRef.current.progress = checkpoint;
    saveReadingCheckpoint(checkpoint);
    // The checkpoint helper closes over the current article and mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, postId, readingProgress, readingProgressPostId]);

  const handleShare = async () => {
    const shareData = {
      title: article?.title || t("essay"),
      text: article?.summary || undefined,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success(t("shared"));
        return;
      }
      await navigator.clipboard.writeText(shareData.url);
      toast.success(t("linkCopied"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
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
                    {article.authorName?.trim() ? (
                      <Link
                        className="text-foreground text-sm font-medium no-underline"
                        href={`/single/authors/${encodeURIComponent(article.authorName.trim())}`}
                      >
                        {article.authorName.trim()}
                      </Link>
                    ) : (
                      <Typography type="body-sm" weight="medium">
                        Odyssey
                      </Typography>
                    )}
                  </div>
                  <ArticleDate value={getPostPublishedAt(article)} />
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

              <ArticleStructuredData article={article} slug={slug} />

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
                  className="mt-16 flex flex-col gap-4"
                >
                  <Separator />
                  <div className="flex flex-col gap-1">
                    <Typography type="body-sm" weight="semibold">
                      {t("continueInColumn")}
                    </Typography>
                    <Link className="text-sm no-underline" href={`/columns/${article.series.slug}`}>
                      {article.series.name}
                      <Link.Icon />
                    </Link>
                    <ColumnInstallment series={article.series} slug={article.slug} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {article.navigation.prev ? (
                      <Card>
                        <Card.Header>
                          <Card.Description>{t("previous")}</Card.Description>
                          <Card.Title>
                            <Link
                              className="text-foreground line-clamp-2 no-underline"
                              href={`/single/${article.navigation.prev.slug}`}
                            >
                              {article.navigation.prev.title}
                            </Link>
                          </Card.Title>
                        </Card.Header>
                      </Card>
                    ) : (
                      <span />
                    )}
                    {article.navigation.next ? (
                      <Card>
                        <Card.Header className="sm:items-end sm:text-end">
                          <Card.Description>{t("next")}</Card.Description>
                          <Card.Title>
                            <Link
                              className="text-foreground line-clamp-2 no-underline"
                              href={`/single/${article.navigation.next.slug}`}
                            >
                              {article.navigation.next.title}
                            </Link>
                          </Card.Title>
                        </Card.Header>
                      </Card>
                    ) : null}
                  </div>
                </nav>
              ) : (
                <ReadNext article={article} />
              )}
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

            {postId != null ? (
              <ReadingListButton
                postId={postId}
                isSaved={isInReadingList}
                isRefreshing={isFetching}
              />
            ) : null}

            <Tooltip delay={100}>
              <Button
                isIconOnly
                aria-label={t("readingLibrary")}
                size="sm"
                variant="ghost"
                onPress={() => router.push("/library")}
              >
                <Icon icon="gravity-ui:book-open" />
              </Button>
              <Tooltip.Content>{t("readingLibrary")}</Tooltip.Content>
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
                      <Icon icon="gravity-ui:share" />
                      {t("shareArticle")}
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

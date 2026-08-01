"use client";

import {
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Card,
  Chip,
  Input,
  Popover,
  ProgressCircle,
  Tooltip,
  Skeleton,
  toast,
  Typography,
  Separator,
  Avatar,
} from "@heroui/react";
import { ActionBar, Rating, RichTextEditor, Sheet, Timeline } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useDebouncedCallback } from "@mantine/hooks";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CommentSystem } from "@/components/comment";
import { MotionRichTextEditor } from "@/components/ui";
import { ExtensionKit } from "@/components/rich-text/extensions/extension-kit";
import { RichTextTableOfContents } from "@/components/rich-text/table-of-contents";
import type { JSONContent } from "@tiptap/react";
import type { PostResponse } from "@/features/blog";
import {
  ArticleTypography,
  useFavoritePostMutation,
  useGetPublicPostBySlugQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/features/blog";
import { FluidBackdrop } from "@/components/background/fluid-backdrop";
import { ArticleSidebar } from "./article-sidebar";

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

export default function SinglePage({ params }: SinglePageProps) {
  const router = useRouter();
  const { slug } = use(params);
  const [isActionBarOpen, setIsActionBarOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [optimisticLike, setOptimisticLike] = useState<OptimisticLikeState | null>(null);
  const [optimisticFavorite, setOptimisticFavorite] = useState<OptimisticFavoriteState | null>(
    null
  );

  const { scrollY, scrollYProgress } = useScroll();
  const { data: serverArticle, isLoading: queryIsLoading } = useGetPublicPostBySlugQuery(slug);

  const article = serverArticle;

  const isLoading = queryIsLoading && !article;

  const articleContent = article?.content;
  const parsedContent = useMemo<JSONContent | undefined>(() => {
    if (!articleContent) return undefined;
    const trimmed = articleContent.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return undefined; // It is plain text or Markdown, not JSON
    }
    try {
      return JSON.parse(trimmed) as JSONContent;
    } catch {
      return undefined;
    }
  }, [articleContent]);
  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();
  const [favoritePost, { isLoading: isFavoriting }] = useFavoritePostMutation();
  const postId = article?.id;
  const serverIsLiked = article?.isLiked || false;
  const serverLikesCount = article?.likesCount || 0;
  const serverIsFavorited = article?.isFavorited || false;
  const serverFavoritesCount = article?.favoritesCount || 0;
  const currentOptimisticLike = optimisticLike?.postId === postId ? optimisticLike : null;
  const currentOptimisticFavorite =
    optimisticFavorite?.postId === postId ? optimisticFavorite : null;
  const isLiked = currentOptimisticLike?.isLiked ?? serverIsLiked;
  const likesCount = currentOptimisticLike?.likesCount ?? serverLikesCount;
  const isFavorited = currentOptimisticFavorite?.isFavorited ?? serverIsFavorited;
  const favoritesCount = currentOptimisticFavorite?.favoritesCount ?? serverFavoritesCount;

  const revealWhenScrollSettles = useDebouncedCallback((latestScrollY: number) => {
    setIsActionBarOpen(latestScrollY > 160);
  }, 700);

  useMotionValueEvent(scrollY, "change", (latestScrollY) => {
    const previousScrollY = scrollY.getPrevious() ?? 0;
    const isPastArticleHeader = latestScrollY > 160;
    const isScrollingUp = latestScrollY < previousScrollY;

    setIsActionBarOpen(isPastArticleHeader && isScrollingUp);
    revealWhenScrollSettles(latestScrollY);
  });

  useMotionValueEvent(scrollYProgress, "change", (latestProgress) => {
    setReadingProgress(Math.round(latestProgress * 100));
  });

  useEffect(() => () => revealWhenScrollSettles.cancel(), [revealWhenScrollSettles]);

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

  return (
    <>
      <FluidBackdrop scrollYProgress={scrollYProgress} />

      <header className="relative w-full px-6 pt-32 pb-16 md:px-12 lg:px-24">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          {isLoading || !article ? (
            <div className="space-y-5 rounded-lg bg-transparent p-4">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-3/5 rounded-lg" />
                <Skeleton className="h-12 w-4/5 rounded-lg" />
                <Skeleton className="h-12 w-2/5 rounded-lg" />
              </div>
            </div>
          ) : (
            <>
              <Breadcrumbs className="font-mono text-[11px] font-semibold tracking-wider uppercase">
                <BreadcrumbsItem>Chronicle</BreadcrumbsItem>
                <BreadcrumbsItem>
                  {article.category ? article.category.name : "Uncategorized"}
                </BreadcrumbsItem>
                <BreadcrumbsItem className="text-muted">
                  <span className="flex items-center gap-1.5">
                    <Icon icon="lucide:clock" className="size-3.5" />
                    {getEstimatedReadingMinutes(article)} MIN READ
                  </span>
                </BreadcrumbsItem>
              </Breadcrumbs>

              <Typography type="h1" className="leading-tight font-bold text-balance">
                {article.title}
              </Typography>

              {article.summary && (
                <Typography
                  type="body"
                  color="muted"
                  className="text-lg leading-relaxed font-normal text-balance"
                >
                  {article.summary}
                </Typography>
              )}

              <Separator className="my-2 opacity-50" />

              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 select-none">
                  <Avatar
                    size="sm"
                    className="border border-neutral-700/30 bg-neutral-800 text-neutral-200"
                  >
                    <Avatar.Fallback>
                      {(article.authorName || "Anonymous").slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar>

                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-neutral-200">
                      {article.authorName || "Anonymous"}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {new Date(article.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {article.tags?.map((tag) => (
                    <Chip
                      key={tag.id}
                      size="sm"
                      variant="soft"
                      className="font-mono text-[10px] uppercase"
                    >
                      #{tag.name}
                    </Chip>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Grid Body */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 justify-center gap-8 px-4 py-12 md:px-6 lg:grid-cols-[260px_minmax(0,760px)] lg:px-8 xl:grid-cols-[280px_minmax(0,760px)] xl:gap-12 2xl:gap-16 2xl:px-12">
        <ArticleSidebar slug={slug} />

        <article className="mx-auto w-full max-w-[760px] min-w-0">
          <section className="mx-auto max-w-190 py-0">
            {isLoading || !article ? (
              <>
                <div className="space-y-8">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="animate-pulse space-y-3">
                      <div className="h-4 w-full rounded bg-neutral-900" />
                      <div className="h-4 w-full rounded bg-neutral-900" />
                      <div className="h-4 w-5/6 rounded bg-neutral-900" />
                    </div>
                  ))}
                </div>

                <div className="my-12 h-px bg-neutral-800" />

                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-1/2 rounded bg-neutral-900" />
                  <div className="h-4 w-full rounded bg-neutral-900" />
                  <div className="h-4 w-4/5 rounded bg-neutral-900" />
                </div>
              </>
            ) : (
              <ArticleTypography>
                {parsedContent ? (
                  <MotionRichTextEditor
                    key={article.content}
                    isReadOnly
                    extensions={ExtensionKit}
                    defaultValue={parsedContent}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <RichTextEditor.Shell className="border-none bg-transparent p-0">
                      <RichTextEditor.Content />
                      <RichTextTableOfContents placement="right" />
                    </RichTextEditor.Shell>
                  </MotionRichTextEditor>
                ) : (
                  <p className="text-default-500 text-base leading-8 whitespace-pre-wrap">
                    {article.content || "No content has been published for this chronicle entry."}
                  </p>
                )}
              </ArticleTypography>
            )}
          </section>
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
                    <Button fullWidth variant="ghost" onPress={() => setIsCommentSheetOpen(true)}>
                      <Icon icon="lucide:message-square" className="size-4" />
                      Comments
                    </Button>
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
                <ProgressCircle
                  className="cursor-pointer"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  aria-label="Reading progress"
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
              </Tooltip.Trigger>
              <Tooltip.Content>{readingProgress}% , back to top</Tooltip.Content>
            </Tooltip>
          </ActionBar.Suffix>
        </ActionBar>

        <Sheet
          isDetached
          isOpen={isCommentSheetOpen}
          placement="bottom"
          onOpenChange={setIsCommentSheetOpen}
        >
          <Sheet.Backdrop variant="blur">
            <Sheet.Content className="w-[420px] max-w-[calc(100vw-2rem)]">
              <Sheet.Dialog>
                <Sheet.CloseTrigger />

                <Sheet.Header>
                  <Sheet.Heading>Comments</Sheet.Heading>
                </Sheet.Header>

                <Sheet.Body className="min-h-0 overflow-y-auto">
                  {postId ? (
                    <CommentSystem postId={postId} />
                  ) : (
                    <p className="text-muted text-sm">
                      Comments will be available once the article loads.
                    </p>
                  )}
                </Sheet.Body>

                <Sheet.Footer>
                  <Sheet.Close>
                    <Button fullWidth variant="secondary">
                      Done
                    </Button>
                  </Sheet.Close>
                </Sheet.Footer>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>
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

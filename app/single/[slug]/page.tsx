"use client";

import {
  Button,
  Chip,
  Popover,
  ProgressCircle,
  Separator,
  Surface,
  Tooltip,
  toast,
} from "@heroui/react";
import { ActionBar, KPI, NumberValue, Sheet } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useDebouncedCallback } from "@mantine/hooks";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { CommentSystem } from "@/components/comment";
import type { PostResponse } from "@/lib/features/post/post-api";
import {
  useFavoritePostMutation,
  useGetPublicPostBySlugQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/lib/features/post/post-api";
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
  const { data: article } = useGetPublicPostBySlugQuery(slug);
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
    <Surface
      variant="transparent"
      className="grid min-h-screen w-full grid-cols-1 gap-8 px-4 py-6 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[300px_minmax(0,1fr)_280px] xl:gap-10 2xl:grid-cols-[320px_minmax(0,1fr)_320px] 2xl:px-12"
    >
      <ArticleSidebar slug={slug} />

      <article className="min-w-0">
        <header className="border-b border-neutral-800 pb-5">
          <div className="h-12 w-2/3 bg-neutral-900" />

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 shrink-0 rounded-full bg-neutral-800" />

              <div className="space-y-2">
                <div className="h-3 w-52 bg-neutral-800" />
                <div className="h-3 w-40 bg-neutral-900" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-5 w-14 bg-neutral-900" />
              <div className="h-5 w-14 bg-neutral-900" />
              <div className="h-5 w-14 bg-neutral-900" />
            </div>
          </div>
        </header>

        <nav className="grid grid-cols-1 border-b border-neutral-800 sm:grid-cols-2">
          <div className="flex h-14 items-center border-neutral-800 sm:border-r">
            <div className="h-3 w-3/4 bg-neutral-900" />
          </div>

          <div className="flex h-14 items-center justify-end">
            <div className="h-3 w-2/3 bg-neutral-900" />
          </div>
        </nav>

        <section className="mt-8">
          <div className="aspect-video w-full bg-neutral-900" />
        </section>

        <section className="mx-auto max-w-190 py-12">
          <div className="space-y-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="h-4 w-full bg-neutral-900" />
                <div className="h-4 w-full bg-neutral-900" />
                <div className="h-4 w-5/6 bg-neutral-900" />
              </div>
            ))}
          </div>

          <div className="my-12 h-px bg-neutral-800" />

          <div className="space-y-4">
            <div className="h-8 w-1/2 bg-neutral-900" />
            <div className="h-4 w-full bg-neutral-900" />
            <div className="h-4 w-4/5 bg-neutral-900" />
          </div>
        </section>

        <span className="sr-only">Current article: {slug}</span>
      </article>

      <aside className="hidden min-w-0 xl:block">
        <div className="sticky top-6">
          <ArticleSnapshot article={article} favoritesCount={favoritesCount} />
        </div>
      </aside>

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
    </Surface>
  );
}

interface ArticleSnapshotProps {
  article?: PostResponse;
  favoritesCount: number;
}

function ArticleSnapshot({ article, favoritesCount }: ArticleSnapshotProps) {
  const categoryName = article?.category?.name;
  const readMinutes = getEstimatedReadingMinutes(article);

  return (
    <KPI variant="secondary" aria-label="Article snapshot" className="gap-4">
      <KPI.Header>
        <KPI.Title>Reading Brief</KPI.Title>
      </KPI.Header>

      <KPI.Content>
        <KPI.Value maximumFractionDigits={0} value={readMinutes}>
          <NumberValue.Suffix>min</NumberValue.Suffix>
        </KPI.Value>
        <KPI.Trend trend="neutral">estimated</KPI.Trend>
      </KPI.Content>

      <KPI.Separator variant="secondary" />

      <KPI.Footer className="flex flex-col items-stretch gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="text-muted text-xs">Readers</p>
            <NumberValue maximumFractionDigits={1} notation="compact" value={article?.views ?? 0} />
          </div>

          <div className="min-w-0">
            <p className="text-muted text-xs">Saved</p>
            <NumberValue maximumFractionDigits={1} notation="compact" value={favoritesCount} />
          </div>
        </div>

        {categoryName || article?.series ? (
          <div className="flex flex-wrap gap-2">
            {categoryName ? (
              <Chip color="accent" size="sm" variant="soft">
                {categoryName}
              </Chip>
            ) : null}
            {article?.series ? (
              <Chip size="sm" variant="tertiary">
                {article.series.name}
                {article.seriesOrder ? ` · Part ${article.seriesOrder}` : ""}
              </Chip>
            ) : null}
          </div>
        ) : null}
      </KPI.Footer>
    </KPI>
  );
}

function getEstimatedReadingMinutes(article?: PostResponse) {
  const source = `${article?.content ?? ""} ${article?.summary ?? ""}`.trim();

  if (!source) return 4;

  const wordCount = source.split(/\s+/).filter(Boolean).length;
  const approximateCount = wordCount > 20 ? wordCount : Math.ceil(source.length / 700);

  return Math.max(1, Math.ceil(approximateCount / 225));
}

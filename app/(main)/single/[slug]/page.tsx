"use client";

import {
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Popover,
  ProgressCircle,
  TextField,
  Tooltip,
  Skeleton,
  toast,
  Typography,
  Separator,
  Avatar,
} from "@heroui/react";
import { ActionBar, RichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useDebouncedCallback } from "@mantine/hooks";
import { useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, use, useEffect, useMemo, useRef, useState } from "react";
import { CommentSheet } from "@/components/comment";
import { MotionRichTextEditor } from "@/components/ui";
import { ExtensionKit } from "@/components/rich-text/extensions/extension-kit";
import { RichTextTableOfContents } from "@/components/rich-text/table-of-contents";
import {
  normalizeRichTextDocument,
  parseJSONContent,
} from "@/components/rich-text/utils/document-normalizer";
import type { PostResponse } from "@/features/blog";
import {
  ArticleTypography,
  useFavoritePostMutation,
  useGetPublicPostBySlugQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/features/blog";
import { FluidBackdrop } from "@/components/background/fluid-backdrop";
import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import { ReadingSession } from "@/components/reading/reading-session";
import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  useAddPostToCollectionMutation,
  useCreatePostCollectionMutation,
  useGetPostCollectionsQuery,
  useRecordReadingProgressMutation,
} from "@/lib/features/library";
import { getReadingPositionId } from "@/lib/reading-position";
import { useAppSelector } from "@/lib/hooks";
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

export default function SinglePage({ params }: SinglePageProps) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { slug } = use(params);
  const [isActionBarOpen, setIsActionBarOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingProgressPostId, setReadingProgressPostId] = useState<number | null>(null);
  const [collectionPendingId, setCollectionPendingId] = useState<number | null>(null);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [optimisticLike, setOptimisticLike] = useState<OptimisticLikeState | null>(null);
  const [optimisticFavorite, setOptimisticFavorite] = useState<OptimisticFavoriteState | null>(
    null
  );
  const readingProgressRef = useRef({ postId: null as number | null, progress: 0 });
  const restoredPositionRef = useRef<string | null>(null);

  const { scrollY, scrollYProgress } = useScroll();
  const { data: serverArticle, isLoading: queryIsLoading } = useGetPublicPostBySlugQuery(slug);

  const article = serverArticle;

  const isLoading = queryIsLoading && !article;

  const parsedContent = useMemo(() => {
    const content = article?.contentType === "JSON" ? parseJSONContent(article.content) : null;
    return content ? normalizeRichTextDocument(content) : null;
  }, [article]);
  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();
  const [favoritePost, { isLoading: isFavoriting }] = useFavoritePostMutation();
  const [recordReadingProgress] = useRecordReadingProgressMutation();
  const { data: collections = [], isLoading: isLoadingCollections } = useGetPostCollectionsQuery(
    undefined,
    { skip: !isAuthenticated }
  );
  const [addPostToCollection] = useAddPostToCollectionMutation();
  const [createPostCollection, { isLoading: isCreatingCollection }] =
    useCreatePostCollectionMutation();
  const postId = article?.id;
  const serverIsLiked = article?.isLiked || false;
  const serverLikesCount = article?.likesCount || 0;
  const serverIsFavorited = article?.isFavorited || false;
  const serverFavoritesCount = article?.favoritesCount || 0;
  const currentOptimisticLike = optimisticLike?.postId === postId ? optimisticLike : null;
  const currentOptimisticFavorite =
    optimisticFavorite?.postId === postId ? optimisticFavorite : null;

  useEffect(() => {
    if (!parsedContent || !postId) return;

    const targetId = getReadingPositionId(window.location.hash);
    if (!targetId) return;

    const restoreKey = `${postId}:${targetId}`;
    if (restoredPositionRef.current === restoreKey) return;

    let contentFrame: number | null = null;
    const frame = window.requestAnimationFrame(() => {
      contentFrame = window.requestAnimationFrame(() => {
        const target = document.getElementById(targetId);

        if (!target || !target.closest("[data-reading-content]")) return;

        restoredPositionRef.current = restoreKey;
        target.setAttribute("tabindex", "-1");
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
        target.focus({ preventScroll: true });
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (contentFrame !== null) window.cancelAnimationFrame(contentFrame);
    };
  }, [parsedContent, postId]);
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
    setCollectionName("");
    setCollectionDescription("");
    setIsCreateCollectionOpen(true);
  };

  const handleCreateCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postId) return;

    const name = collectionName.trim();
    if (!name) {
      toast.danger("Enter a collection name.");
      return;
    }

    try {
      const collection = await createPostCollection({
        name,
        description: collectionDescription.trim() || undefined,
      }).unwrap();
      setIsCreateCollectionOpen(false);
      setCollectionPendingId(collection.id);

      try {
        await addPostToCollection({ collectionId: collection.id, postId }).unwrap();
      } finally {
        setCollectionPendingId(null);
      }
    } catch {
      // The mutations display their own failure toast.
    }
  };

  return (
    <>
      <FluidBackdrop scrollYProgress={scrollYProgress} />

      <header className="relative w-full px-6 pt-28 pb-10 md:px-12 lg:px-24">
        <div className="mx-auto w-full max-w-5xl">
          {isLoading || !article ? (
            <div className="space-y-5 rounded-3xl bg-transparent p-8">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-3/5 rounded-lg" />
                <Skeleton className="h-12 w-4/5 rounded-lg" />
                <Skeleton className="h-12 w-2/5 rounded-lg" />
              </div>
            </div>
          ) : (
            <SmartColorSurface
              className="rounded-4xl"
              seed={article.slug}
              tone={getSmartColorTone({
                categoryName: article.category?.name,
                title: article.title,
              })}
            >
              <div className="flex min-h-[430px] flex-col justify-end gap-6 p-7 sm:p-10 lg:p-14">
                <Breadcrumbs className="text-xs font-medium text-white/72">
                  <BreadcrumbsItem className="text-white/72" href="/blog">
                    <span className="text-white/72">Chronicle</span>
                  </BreadcrumbsItem>
                  {article.series ? (
                    <BreadcrumbsItem
                      className="text-white/72"
                      href={`/columns/${article.series.slug}`}
                    >
                      <span className="text-white/72">{article.series.name}</span>
                    </BreadcrumbsItem>
                  ) : null}
                  <BreadcrumbsItem className="text-white/72">
                    <span className="text-white/72">
                      {article.category ? article.category.name : "Uncategorized"}
                    </span>
                  </BreadcrumbsItem>
                  <BreadcrumbsItem className="text-white/72">
                    <span className="flex items-center gap-1.5 text-white/72">
                      <Icon aria-hidden="true" icon="lucide:clock" className="size-3.5" />
                      {getEstimatedReadingMinutes(article)} min read
                    </span>
                  </BreadcrumbsItem>
                </Breadcrumbs>

                <Typography
                  type="h1"
                  className="max-w-4xl leading-[1.02] font-bold text-balance text-white"
                >
                  {article.title}
                </Typography>

                {article.summary && (
                  <Typography
                    type="body"
                    className="max-w-2xl text-lg leading-relaxed font-normal text-balance text-white/76"
                  >
                    {article.summary}
                  </Typography>
                )}

                <div className="flex flex-col items-start justify-between gap-6 border-t border-white/16 pt-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 select-none">
                    <Avatar size="sm" className="bg-white/14 text-white">
                      <Avatar.Fallback>
                        {(article.authorName || "Anonymous").slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>

                    <div className="flex flex-col text-left">
                      <Typography type="body-sm" weight="semibold" className="text-white">
                        {article.authorName || "Anonymous"}
                      </Typography>
                      <Typography type="body-xs" className="text-white/62">
                        {new Date(article.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {article.tags?.map((tag) => (
                      <Chip
                        key={tag.id}
                        size="sm"
                        variant="soft"
                        className="bg-white/12 text-white"
                      >
                        {tag.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </SmartColorSurface>
          )}
        </div>
      </header>

      {/* Main Grid Body */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 justify-center gap-8 px-4 py-12 md:px-6 lg:grid-cols-[260px_minmax(0,760px)] lg:px-8 xl:grid-cols-[280px_minmax(0,760px)] xl:gap-12 2xl:gap-16 2xl:px-12">
        <ArticleSidebar slug={slug} />

        <article
          id={postId ? `article-${postId}` : undefined}
          data-reading-content
          className="mx-auto w-full max-w-[760px] min-w-0"
        >
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
              <>
                <ReadingSession
                  key={article.id}
                  articleId={article.id}
                  articleTitle={article.title}
                  estimatedMinutes={getEstimatedReadingMinutes(article)}
                />
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
                    <p className="text-default-500 text-base leading-8">
                      This article is unavailable because its content is not a supported Tiptap
                      document.
                    </p>
                  )}
                </ArticleTypography>
              </>
            )}
          </section>

          {article?.series ? (
            <nav
              aria-label={`${article.series.name} column navigation`}
              className="border-default-200 mt-14 border-t pt-8"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-muted text-xs font-medium">Continue this column</p>
                  <Link
                    className="text-foreground mt-1 inline-flex items-center gap-2 text-lg font-semibold no-underline"
                    href={`/columns/${article.series.slug}`}
                  >
                    {article.series.name}
                    <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
                  </Link>
                </div>
                {article.seriesOrder != null ? (
                  <span className="text-muted font-mono text-xs tabular-nums">
                    Essay {article.seriesOrder + 1}
                  </span>
                ) : null}
              </div>

              {article.navigation?.prev || article.navigation?.next ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {article.navigation.prev ? (
                    <Link
                      className="border-default-200 hover:border-accent/50 hover:bg-default group flex min-h-24 flex-col gap-2 border p-4 no-underline transition-colors"
                      href={`/single/${article.navigation.prev.slug}`}
                    >
                      <span className="text-muted flex items-center gap-1.5 text-xs font-medium">
                        <Icon aria-hidden="true" icon="lucide:arrow-left" className="size-3.5" />
                        Previous essay
                      </span>
                      <span className="text-foreground line-clamp-2 text-sm font-semibold">
                        {article.navigation.prev.title}
                      </span>
                    </Link>
                  ) : (
                    <div aria-hidden="true" className="hidden sm:block" />
                  )}
                  {article.navigation.next ? (
                    <Link
                      className="border-default-200 hover:border-accent/50 hover:bg-default group flex min-h-24 flex-col items-start gap-2 border p-4 no-underline transition-colors sm:items-end sm:text-right"
                      href={`/single/${article.navigation.next.slug}`}
                    >
                      <span className="text-muted flex items-center gap-1.5 text-xs font-medium">
                        Next essay
                        <Icon aria-hidden="true" icon="lucide:arrow-right" className="size-3.5" />
                      </span>
                      <span className="text-foreground line-clamp-2 text-sm font-semibold">
                        {article.navigation.next.title}
                      </span>
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
                        <div className="border-separator my-1 border-t" />
                        <p className="text-muted px-2 pt-1 text-xs font-medium">
                          Save to collection
                        </p>
                        {isLoadingCollections ? (
                          <p className="text-muted px-2 py-2 text-sm">Loading collections...</p>
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

        <Modal>
          <Modal.Backdrop
            isOpen={isCreateCollectionOpen}
            onOpenChange={setIsCreateCollectionOpen}
            variant="blur"
          >
            <Modal.Container size="sm">
              <Modal.Dialog className="sm:max-w-md">
                <Modal.CloseTrigger />
                <Form onSubmit={handleCreateCollection}>
                  <Modal.Header>
                    <Modal.Heading>Create collection</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-4 py-4">
                    <p className="text-muted text-sm">Save this article to a new collection.</p>
                    <TextField isRequired name="collection-name">
                      <Label>Name</Label>
                      <Input
                        autoFocus
                        maxLength={80}
                        placeholder="e.g. Design references"
                        value={collectionName}
                        onChange={(event) => setCollectionName(event.target.value)}
                      />
                      <FieldError />
                    </TextField>
                    <TextField name="collection-description">
                      <Label>Description</Label>
                      <Input
                        maxLength={300}
                        placeholder="What belongs in this collection?"
                        value={collectionDescription}
                        onChange={(event) => setCollectionDescription(event.target.value)}
                      />
                    </TextField>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" size="sm" variant="tertiary">
                      Cancel
                    </Button>
                    <Button isPending={isCreatingCollection} size="sm" type="submit">
                      Create and save
                    </Button>
                  </Modal.Footer>
                </Form>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

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

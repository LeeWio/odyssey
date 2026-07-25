"use client";

import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Popover,
  ProgressCircle,
  Separator,
  Surface,
  Tooltip,
  toast,
} from "@heroui/react";
import {
  ActionBar,
  EmojiReactionButton,
  HoverCard,
  KPI,
  NumberValue,
  Rating,
  RichTextEditor,
  Sheet,
  Timeline,
  TrendChip,
} from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useDebouncedCallback } from "@mantine/hooks";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { CommentSystem } from "@/components/comment";
import { MotionRichTextEditor } from "@/components/ui";
import { ExtensionKit } from "@/components/rich-text/extensions/extension-kit";
import { RichTextTableOfContents } from "@/components/rich-text/table-of-contents";
import type { JSONContent } from "@tiptap/react";
import type { PostResponse } from "@/lib/features/post/post-api";
import {
  useFavoritePostMutation,
  useGetPublicPostBySlugQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/lib/features/post/post-api";
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

  const [reactions, setReactions] = useState<{
    [key: string]: { count: number; selected: boolean };
  }>({
    "👍": { count: 124, selected: false },
    "❤️": { count: 89, selected: false },
    "💡": { count: 45, selected: false },
    "😮": { count: 12, selected: false },
  });

  const handleReactionToggle = (emoji: string) => {
    setReactions((prev) => {
      const current = prev[emoji];
      if (!current) return prev;
      return {
        ...prev,
        [emoji]: {
          count: current.selected ? current.count - 1 : current.count + 1,
          selected: !current.selected,
        },
      };
    });
  };
  const { scrollY, scrollYProgress } = useScroll();
  const { data: serverArticle, isLoading: queryIsLoading } = useGetPublicPostBySlugQuery(slug);

  const article = useMemo(() => {
    if (!queryIsLoading && !serverArticle) {
      return getMockArticle(slug);
    }
    return serverArticle;
  }, [serverArticle, queryIsLoading, slug]);

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

  const renderAuthorHoverCardContent = () => (
    <HoverCard.Content className="relative z-50 w-80 rounded-2xl border border-neutral-800/80 bg-zinc-950/95 p-5 text-left shadow-xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            size="sm"
            className="border border-neutral-700/50 bg-neutral-800 text-neutral-200"
          >
            <Avatar.Fallback>
              {(article?.authorName || "Anonymous").slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col items-start justify-center">
            <span className="text-sm leading-none font-bold text-neutral-200">
              {article?.authorName || "Anonymous"}
            </span>
            <span className="mt-1 font-mono text-[10px] text-neutral-500">@odyssey_creative</span>
          </div>
        </div>
        <Chip
          size="sm"
          variant="soft"
          color="accent"
          className="h-5 px-2 py-0 font-mono text-[10px] font-bold tracking-wider"
        >
          CREATOR
        </Chip>
      </div>

      <p className="mt-4 pl-px font-sans text-xs leading-relaxed text-neutral-400">
        在比特的虚空中编织引力弹簧，于视口的方寸间捕捉数字晨光。专注于次世代极简数字媒介的美学探索。
      </p>

      <div className="mt-4 flex gap-4 border-t border-neutral-800/40 pt-4 text-xs font-semibold select-none">
        <div className="flex items-center gap-1.5">
          <p className="text-neutral-200">12</p>
          <p className="font-normal text-neutral-500">Articles</p>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-neutral-200">4.8K</p>
          <p className="font-normal text-neutral-500">Readers</p>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-neutral-200">1.2K</p>
          <p className="font-normal text-neutral-500">Stars</p>
        </div>
      </div>
    </HoverCard.Content>
  );

  return (
    <>
      <FluidBackdrop scrollYProgress={scrollYProgress} />

      {/* Cinematic Full-Width Hero Header */}
      <header className="relative w-full overflow-hidden border-b border-neutral-800/40 px-6 pt-32 pb-16 md:px-12 lg:px-24">
        {/* Cover image blurred background bleed */}
        {article?.coverImage && (
          <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-hidden select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-15 blur-[80px] dark:opacity-10"
            />
            <div className="via-background/40 to-background absolute inset-0 bg-gradient-to-b from-transparent" />
          </div>
        )}

        <div className="mx-auto flex w-full max-w-190 flex-col gap-6 text-center md:text-left">
          {/* Category Chip */}
          <div className="flex justify-center md:justify-start">
            {article?.category ? (
              <span className="text-accent font-mono text-[11px] font-semibold tracking-[0.15em] uppercase select-none">
                CATEGORY // {article.category.name}
              </span>
            ) : (
              <span className="font-mono text-[11px] font-semibold tracking-[0.15em] text-neutral-500 uppercase select-none">
                CATEGORY // UNKNOWN
              </span>
            )}
          </div>

          {/* High-Contrast Title Hierarchy */}
          <div className="flex flex-col gap-3">
            {isLoading || !article ? (
              <div className="h-16 w-3/4 animate-pulse rounded bg-neutral-900" />
            ) : (
              <h1 className="flex flex-col gap-2">
                {/* Line 1: Elegant Display Serif Italic */}
                <span className="font-display text-default-400 text-3xl leading-none font-normal tracking-normal italic md:text-5xl lg:text-6xl">
                  {article.title.includes("：")
                    ? article.title.split("：")[0]
                    : "无尽极光与静谧之所"}
                </span>
                {/* Line 2: Massive Solid Sans Black */}
                <span className="text-foreground font-sans text-4xl leading-[0.95] font-black tracking-[-0.04em] uppercase md:text-6xl lg:text-7xl">
                  {article.title.includes("：")
                    ? article.title.split("：")[1]
                    : "数字社论排版的空间美学"}
                </span>
              </h1>
            )}
          </div>

          {/* Minimalist Metadata Panel */}
          <div className="mt-4 flex flex-col items-center justify-between gap-6 border-t border-neutral-800/40 pt-6 sm:flex-row">
            {isLoading || !article ? (
              <div className="flex animate-pulse items-center gap-4">
                <div className="size-10 rounded-full bg-neutral-800" />
                <div className="h-3 w-40 rounded bg-neutral-800" />
              </div>
            ) : (
              <HoverCard>
                <HoverCard.Trigger>
                  <div className="group/author flex cursor-pointer items-center gap-3 select-none">
                    <Avatar
                      size="sm"
                      className="group-hover/author:border-accent border border-neutral-700/30 bg-neutral-800 text-neutral-200 transition-colors"
                    >
                      <Avatar.Fallback>
                        {(article.authorName || "Anonymous").slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>

                    <div className="flex flex-col text-left">
                      <span className="group-hover/author:text-accent text-xs font-semibold text-neutral-300 transition-colors">
                        {article.authorName || "Anonymous"}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Published on{" "}
                        {new Date(article.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </HoverCard.Trigger>
                {renderAuthorHoverCardContent()}
              </HoverCard>
            )}

            {/* Read Time KPI Brief & Tags */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 font-mono text-[10px] text-neutral-400 uppercase select-none">
                <Icon icon="lucide:book-open" className="size-3.5 text-neutral-500" />
                <span>READ: {getEstimatedReadingMinutes(article)} MIN</span>
              </span>

              <div className="hidden flex-wrap gap-2 sm:flex">
                {article?.tags?.map((tag) => (
                  <Chip
                    key={tag.id}
                    size="sm"
                    variant="soft"
                    color="default"
                    className="h-5 px-2 py-0 text-[10px]"
                  >
                    #{tag.name}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Body */}
      <div className="relative z-10 grid min-h-screen w-full grid-cols-1 gap-8 px-4 py-12 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[300px_minmax(0,1fr)_280px] xl:gap-10 2xl:grid-cols-[320px_minmax(0,1fr)_320px] 2xl:px-12">
        <ArticleSidebar slug={slug} />

        <article className="mx-auto w-full max-w-190 min-w-0">
          <section className="mx-auto max-w-190 py-12">
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
              <div className="prose prose-neutral dark:prose-invert max-w-none">
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
                  <p className="leading-relaxed whitespace-pre-wrap text-neutral-400">
                    {article.content || "No content has been published for this chronicle entry."}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Emoji Reactions Panel */}
          {!isLoading && article && (
            <div className="mt-6 flex w-full flex-col items-center gap-4 border-t border-neutral-800/20 pt-8 md:items-start">
              <span className="font-mono text-[10px] tracking-wider text-neutral-500 uppercase select-none">
                SHARE YOUR TRANSMISSION // 情绪共鸣反馈
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {Object.entries(reactions).map(([emoji, { count, selected }]) => (
                  <EmojiReactionButton
                    key={emoji}
                    isSelected={selected}
                    onChange={() => handleReactionToggle(emoji)}
                    size="md"
                  >
                    <EmojiReactionButton.Emoji>{emoji}</EmojiReactionButton.Emoji>
                    {count > 0 && <EmojiReactionButton.Count>{count}</EmojiReactionButton.Count>}
                  </EmojiReactionButton>
                ))}
              </div>
            </div>
          )}

          {/* Previous & Next Article Navigation */}
          {!isLoading && article && (
            <div className="my-8 grid w-full grid-cols-1 gap-4 border-t border-b border-neutral-800/30 py-8 md:grid-cols-2">
              {/* Previous Article Link */}
              <Button
                variant="ghost"
                onPress={() => router.push("/single/editorial-tactility-and-paper-grain")}
                className="group bg-default-100/10 hover:bg-default-100/25 flex h-auto flex-col items-start gap-2.5 rounded-2xl border border-neutral-800/10 p-5 text-left transition-all duration-300 hover:border-neutral-700/20"
              >
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-neutral-500 uppercase select-none">
                  <Icon
                    icon="lucide:arrow-left"
                    className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1"
                  />
                  <span>PREVIOUS ENTRY</span>
                </span>
                <span className="group-hover:text-accent line-clamp-2 text-sm leading-snug font-semibold whitespace-normal text-neutral-300 transition-colors duration-300">
                  触觉排版学：为何数字媒介需要可触摸的‘纸张纹理’？
                </span>
              </Button>

              {/* Next Article Link */}
              <Button
                variant="ghost"
                onPress={() => router.push("/single/mechanics-of-micro-interactions")}
                className="group bg-default-100/10 hover:bg-default-100/25 flex h-auto flex-col items-end gap-2.5 rounded-2xl border border-neutral-800/10 p-5 text-right transition-all duration-300 hover:border-neutral-700/20"
              >
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-neutral-500 uppercase select-none">
                  <span>NEXT ENTRY</span>
                  <Icon
                    icon="lucide:arrow-right"
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
                <span className="group-hover:text-accent line-clamp-2 text-sm leading-snug font-semibold whitespace-normal text-neutral-300 transition-colors duration-300">
                  物理阻尼与微动效的力学：探寻 UI 动效中的重力阻力
                </span>
              </Button>
            </div>
          )}

          {/* Editorial Author Bio & Newsletter Signup */}
          {!isLoading && article && (
            <Card className="border-default-100 bg-default-50/10 relative z-10 my-8 grid grid-cols-1 gap-8 rounded-2xl border p-6 shadow-none md:grid-cols-[1.2fr_1fr]">
              {/* Left side: Author Bio */}
              <div className="flex flex-col justify-between gap-4 text-left">
                <HoverCard>
                  <HoverCard.Trigger>
                    <div className="group/author flex cursor-pointer items-center gap-3 select-none">
                      <Avatar
                        size="md"
                        className="group-hover/author:border-accent border border-neutral-700/40 bg-neutral-800 text-neutral-200 transition-colors"
                      >
                        <Avatar.Fallback>
                          {(article.authorName || "Anonymous").slice(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>

                      <div className="flex flex-col">
                        <span className="group-hover/author:text-accent text-sm font-semibold text-neutral-200 transition-colors">
                          {article.authorName || "Anonymous"}
                        </span>
                        <span className="text-accent font-mono text-[10px] font-semibold tracking-wider uppercase">
                          CHRONICLE AUTHOR // 主创笔谈
                        </span>
                      </div>
                    </div>
                  </HoverCard.Trigger>
                  {renderAuthorHoverCardContent()}
                </HoverCard>

                <p className="pr-4 font-sans text-xs leading-relaxed text-neutral-400">
                  在比特的虚空中编织引力弹簧，于视口的方寸间捕捉数字晨光。致力于探索具有极简美学品味的次世代数字空间排版规约。
                </p>

                {/* Minimalist social icons & Rating input */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      aria-label="Author Twitter"
                      className="size-8 min-w-8 rounded-lg"
                    >
                      <Icon icon="gravity-ui:logo-x" className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      aria-label="Author Dribbble"
                      className="size-8 min-w-8 rounded-lg"
                    >
                      <Icon icon="gravity-ui:logo-dribbble" className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      aria-label="Author GitHub"
                      className="size-8 min-w-8 rounded-lg"
                    >
                      <Icon icon="gravity-ui:logo-github" className="size-4" />
                    </Button>
                  </div>

                  {/* Post Star Rating input */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-neutral-500 uppercase select-none">
                      RATE:
                    </span>
                    <Rating
                      aria-label="Rate this chronicle"
                      defaultValue={0}
                      size="sm"
                      style={
                        { "--rating-active-color": "var(--color-accent)" } as React.CSSProperties
                      }
                      onValueChange={(val) => {
                        if (val > 0) {
                          toast.success(`Thank you for rating this chronicle ${val} stars!`);
                        }
                      }}
                    >
                      <Rating.Item value={1} />
                      <Rating.Item value={2} />
                      <Rating.Item value={3} />
                      <Rating.Item value={4} />
                      <Rating.Item value={5} />
                    </Rating>
                  </div>
                </div>
              </div>

              {/* Right side: Newsletter Signup */}
              <div className="flex flex-col justify-between gap-4 border-t border-neutral-800/30 pt-6 text-left md:border-t-0 md:border-l md:pt-0 md:pl-8">
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-bold text-neutral-300">ODYSSEY WEEKLY // 订阅周刊</h4>
                  <p className="text-[11px] leading-relaxed text-neutral-500">
                    每周五寄送一封关于数字排版、动效物理与空间美学的灵感密信。
                  </p>
                </div>

                <div className="mt-2 flex w-full flex-col gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email address..."
                    variant="secondary"
                    className="rounded-xl border border-neutral-800/40 bg-neutral-900/30 text-xs transition-colors placeholder:text-neutral-600 hover:bg-neutral-900/30"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:text-accent h-9 w-full rounded-xl border border-neutral-800/40 text-xs font-semibold text-neutral-300 transition-colors hover:border-neutral-700/30"
                    onPress={() => toast.success("Successfully subscribed to Odyssey Weekly!")}
                  >
                    <Icon icon="lucide:mail" className="size-3.5" />
                    <span>Subscribe Now</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <span className="sr-only">Current article: {slug}</span>
        </article>

        <aside className="sticky top-24 flex hidden h-fit min-w-0 flex-col gap-6 xl:block">
          <ArticleSnapshot article={article} favoritesCount={favoritesCount} />

          {/* Series Roadmap Card */}
          {article?.series && (
            <Card className="border-default-100 bg-default-50/20 relative z-10 rounded-2xl border p-5 text-left shadow-none">
              <h3 className="text-foreground mb-4 font-mono text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                SERIES ROADMAP // 专栏连载大纲
              </h3>

              <Timeline size="sm" className="pl-1">
                <Timeline.Item status="current">
                  <Timeline.Rail>
                    <Timeline.Marker>
                      <Icon icon="lucide:book-open" className="text-accent size-3" />
                    </Timeline.Marker>
                    <Timeline.Connector />
                  </Timeline.Rail>
                  <Timeline.Content className="flex min-w-0 flex-col gap-0.5 text-left">
                    <span className="text-accent text-[11px] font-bold">PART 1 (CURRENT)</span>
                    <span className="line-clamp-2 text-xs leading-snug font-semibold text-neutral-200">
                      无尽极光与静谧之所：数字社论排版的空间美学
                    </span>
                  </Timeline.Content>
                </Timeline.Item>

                <Timeline.Item status="default">
                  <Timeline.Rail>
                    <Timeline.Marker>
                      <Icon icon="lucide:lock" className="size-3 text-neutral-600" />
                    </Timeline.Marker>
                    <Timeline.Connector />
                  </Timeline.Rail>
                  <Timeline.Content className="flex min-w-0 flex-col gap-0.5 pb-4 text-left">
                    <span className="text-[11px] font-bold text-neutral-500">PART 2 (SOON)</span>
                    <span className="line-clamp-2 text-xs leading-snug font-semibold text-neutral-400">
                      物理阻尼与微动效的力学：探寻 UI 动效中的重力阻力
                    </span>
                  </Timeline.Content>
                </Timeline.Item>

                <Timeline.Item status="default">
                  <Timeline.Rail>
                    <Timeline.Marker>
                      <Icon icon="lucide:lock" className="size-3 text-neutral-600" />
                    </Timeline.Marker>
                  </Timeline.Rail>
                  <Timeline.Content className="flex min-w-0 flex-col gap-0.5 text-left">
                    <span className="text-[11px] font-bold text-neutral-500">PART 3 (SOON)</span>
                    <span className="line-clamp-2 text-xs leading-snug font-semibold text-neutral-400">
                      反数码触觉学：为什么我们的视口需要可触摸的纸张纤维？
                    </span>
                  </Timeline.Content>
                </Timeline.Item>
              </Timeline>
            </Card>
          )}
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
      </div>
    </>
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
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-muted flex items-center justify-between gap-1 pr-1 text-xs select-none">
              <span>Readers</span>
              <TrendChip
                trend="up"
                size="sm"
                variant="soft"
                className="text-success h-4 min-h-4 origin-right scale-[0.8] py-0 font-mono text-[10px] font-bold"
              >
                +12.4%
              </TrendChip>
            </p>
            <NumberValue maximumFractionDigits={1} notation="compact" value={article?.views ?? 0} />
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-muted flex items-center justify-between gap-1 pr-1 text-xs select-none">
              <span>Saved</span>
              <TrendChip
                trend="up"
                size="sm"
                variant="soft"
                className="text-success h-4 min-h-4 origin-right scale-[0.8] py-0 font-mono text-[10px] font-bold"
              >
                +8.7%
              </TrendChip>
            </p>
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

function getMockArticle(slug: string): PostResponse {
  const contentJSON = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "引言：滚动的视口与沉浸的阈限空间" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "在数字设备占据人们绝大部分视线的时间线里，信息像潮水般不知疲倦地涌动。然而，大多数时候，我们的屏幕排版都是局促、生硬且缺乏感官体验的。阅读，这个曾经代表着人类精神最深刻互动的行为，如今常常退化为手指在冷冰冰的玻璃面板上漫无目的的滑动。",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "我们想要寻找的，是一种属于“流体时代”的、具有社论品味的全新数字空间。它不应该是两边死死固定的简陋长条，也不应该是各种闪烁着嘈杂广告的豆腐格，而是一个充满呼吸张力、重力回弹和触觉微质感的“纯净避难所”。",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "一、极光色彩与重力弹簧物理" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "极光（Aurora Backdrop）是这个阅读避难所的视觉底色。它不只是一个静态的 CSS 渐变色块，而是通过数学公式与交互事件（Scroll & Mousemove）交织而成的液态波谱。当我们滚动屏幕时，背景中漂浮的三组径向气泡，会产生异步的位移与色彩交叠。",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "1. 慢速重水阻尼 (Damping Physics)" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "我们对底层的弹簧物理参数进行了严苛的雕琢（Stiffness = 10, Damping = 24, Mass = 2.2）。在极地重力的牵引下，用户在轻拨鼠标滚轮或滑动触控板时，底部的气泡并不是机械跟随，而是像在深海重水中滑行一般，带着高贵的粘滞感，形成一种具有沉浸仪式感、极其优雅慢镜头的流动节奏。",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "2. 鼠标径向聚光灯与磁性泛光" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "我们在留白空间里铺设了一个磁性微光捕获层。当光标在文章两侧的悬浮目录或右侧推荐卡片上漫步时，底盘会动态晕开一个跟随鼠标、轻柔和缓的径向微亮聚光灯（Cursor Spotlight），透明度精确控制在 6% 到 8%。这使得屏幕边缘的空白区域不再是空洞、死寂的虚无，而是随时对用户的探寻给予温润反馈的感官容器。",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "二、反数字化触觉与 SVG 微噪点" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "绝对的平滑（Seamless Smoothness）往往会带来冰冷、廉价的机器味。在顶配的工艺美术期刊中，纸张的天然纤维纹理（Tooth of the Paper）是必不可少的触感。因此，我们在极光流体图层的最外端，叠加了一层高频分形噪点（Fractal Noise）SVG 微遮罩。",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "它极其微弱，在暗色下仅有 1.2% 的不透明度，在日光下仅有 1.5%。然而，它能瞬间化解低分辨率和广色域面板上渐变过渡处经常出现的“色彩横向断层”（Color Banding），并赋予屏幕一种近似于羊皮纸或手工铜版纸的、可微弱感知的物理阻尼颗粒感。这就是我们追求的“反数码感触觉排版”（Editorial Tactility）。",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "三、粘性多列网格的空间比例" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "传统侧栏设计不仅分散读者的注意力，也限制了屏幕的空间表现力。通过重构响应式的 CSS Grid 网格，我们将主正文包裹在 65ch 的理想行宽内，从而在双眼横扫时减少扫视疲劳。",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "左翼的粘性目录（Sticky TOC）利用 Intersection Observer 自动追踪读者的视点位置。右翼的卡片则负责展示作者简历与核心操作项。在大屏幕上，这种不对称的‘三叶草’结构让每一次滚动都成为一场视觉上的无声歌剧。",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "结语：在喧嚣的洪流中保持静止" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "当读者读到这篇模拟长文的末尾时，底部的滚动进度已经逼近 100%。此时，极光的瑰丽色彩将渐渐消退、沉降，将主舞台交回给最纯净的静谧夜空。在这里，评论区和更深入的讨论组件静候着，没有多余的偏光和耀眼的信息打扰。这就是‘无尽极光与静谧之所’——一个数字时代为灵魂预留的阅读殿堂。",
          },
        ],
      },
    ],
  };

  return {
    id: 9999,
    title: "无尽极光与静谧之所：数字社论排版的空间美学",
    slug: slug,
    content: JSON.stringify(contentJSON),
    summary:
      "本文探讨了流体时代下的高品味数字阅读排版设计，从极光背景物理阻尼微调、SVG 微噪点纸质纹理到粘性不对称网格布局，全方位阐述了如何设计一个充满呼吸感与诗意氛围的数字阅读殿堂。",
    coverImage: "/zelda-landscape.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 42031,
    likesCount: 128,
    favoritesCount: 89,
    isLiked: false,
    isFavorited: false,
    authorName: "奥德赛创意总监",
    status: "PUBLISHED",
    isFeatured: true,
    category: {
      id: 1,
      name: "排版与美学",
      slug: "typography-and-aesthetics",
      description: "关于数字排版与空间视觉美学的探讨",
      icon: "lucide:palette",
      createdAt: new Date().toISOString(),
    },
    series: {
      id: 1,
      name: "数字避难所空间",
      slug: "digital-sanctuaries",
      description: "建立沉浸式与诗意视觉空间的尝试",
      coverImage: null,
      isPublished: true,
      postsCount: 1,
      createdAt: new Date().toISOString(),
    },
    seriesOrder: 1,
    tags: [
      { id: 1, name: "数字排版", slug: "digital-typography", createdAt: new Date().toISOString() },
      { id: 2, name: "极光背景", slug: "aurora-backdrop", createdAt: new Date().toISOString() },
      { id: 3, name: "高定杂志", slug: "premium-editorial", createdAt: new Date().toISOString() },
    ],
  };
}

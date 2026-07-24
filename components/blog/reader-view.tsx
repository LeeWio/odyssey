"use client";

import { Button, cn, Separator, Spinner, Surface, Tooltip, Typography, toast } from "@heroui/react";
import { ActionBar, EmptyState, RichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import type { JSONContent } from "@tiptap/react";
import { motion, useScroll } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommentSystem } from "@/components/comment";
import { ExtensionKit } from "@/components/rich-text/extensions/extension-kit";
import { RichTextTableOfContents } from "@/components/rich-text/table-of-contents";
import {
  useGetPublicPostBySlugQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/lib/features/post/post-api";
import { MotionRichTextEditor, MotionSeparator } from "../ui";

interface ReaderViewProps {
  slug: string;
}

interface LikeRipple {
  id: number;
  color: string;
  delay: number;
  maxScale: number;
}

const BACKGROUND_PRESETS = [
  { name: "Sunset", colors: ["rgba(245, 158, 11, 0.08)", "rgba(244, 63, 94, 0.06)"] }, // Amber + Rose
  { name: "Aurora", colors: ["rgba(16, 185, 129, 0.08)", "rgba(6, 182, 212, 0.08)"] }, // Emerald + Cyan
  { name: "Cosmic", colors: ["rgba(139, 92, 246, 0.08)", "rgba(14, 165, 233, 0.08)"] }, // Violet + Sky Blue
  { name: "Forest", colors: ["rgba(20, 184, 166, 0.08)", "rgba(245, 158, 11, 0.06)"] }, // Teal + Amber
  { name: "Velvet", colors: ["rgba(217, 70, 239, 0.06)", "rgba(99, 102, 241, 0.08)"] }, // Fuchsia + Indigo
  { name: "Abyss", colors: ["rgba(37, 99, 235, 0.08)", "rgba(20, 184, 166, 0.06)"] }, // Blue + Teal
  { name: "Midas", colors: ["rgba(234, 179, 8, 0.08)", "rgba(115, 115, 115, 0.06)"] }, // Yellow + Neutral
  { name: "Orchid", colors: ["rgba(236, 72, 153, 0.06)", "rgba(168, 85, 247, 0.08)"] }, // Pink + Purple
];

const getArticleBackgroundPreset = (id: number | string) => {
  const numId =
    typeof id === "number" ? id : id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = Math.abs(numId) % BACKGROUND_PRESETS.length;
  return BACKGROUND_PRESETS[index]!;
};

const MOCK_POST_FALLBACK = {
  id: 9999,
  title: "HeroUI Pro & The Shattered Epic of Minimalist Interfaces",
  slug: "fallback",
  summary:
    "Exploring how achromatic dark tones, gold accents, and fluid layouts of the HeroUI design system evoke narrative depth and visual tension.",
  coverImage: "/er-hero.png",
  status: "PUBLISHED",
  isFeatured: true,
  views: 1245,
  likesCount: 342,
  favoritesCount: 120,
  isLiked: false,
  isFavorited: false,
  authorName: "OdysseusFallback",
  category: {
    id: 1,
    name: "Aesthetics",
    slug: "aesthetics",
    description: "",
    icon: null,
    createdAt: "2026-07-04T12:00:00.000Z",
  },
  series: null,
  seriesOrder: null,
  tags: [
    { id: 1, name: "Design", slug: "design", createdAt: "2026-07-04T12:00:00.000Z" },
    { id: 2, name: "HeroUI", slug: "heroui", createdAt: "2026-07-04T12:00:00.000Z" },
  ],
  createdAt: "2026-07-04T12:00:00.000Z",
  updatedAt: "2026-07-04T12:00:00.000Z",
  content: JSON.stringify({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "The Philosophy of Achromatic Spaces" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "In modern web development, interfaces are no longer merely flat functional layers; they are portals of narrative depth and branding coherence. To design in achromatic dark—using absolute blacks (#000000), deep zinc greys, and tactile slate outlines—is to invoke an architectural canvas. In this space, typography does not struggle for attention; it rests confidently inside structured containers.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "The Power of Gold Accents" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "When working within an achromatic spectrum, color becomes an intentional event. Rather than painting components with broad primary strokes, we select single high-contrast highlight colors. Gold and deep amber are particularly elite accents.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "The Fluidity of Liquid Islands" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "A static interface is a dead interface. Users judge modern web applications by how they respond to movement. Every hover, click, and panel slide must feel 'alive.' This is where the concept of Liquid Islands emerges—modular, floating layout sections.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "Micro-interactions & Tactile Feedback" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "A true premium feel lives in the invisible details. When a user hovers over a category card, a 1px border highlights instantly, and the content scales downward by 1% with an active spring scale.",
          },
        ],
      },
    ],
  }),
};

export function ReaderView({ slug }: ReaderViewProps) {
  const router = useRouter();

  // RTK Query hook for fetching public blog details
  const { data: postData, isLoading } = useGetPublicPostBySlugQuery(slug);

  const { scrollYProgress } = useScroll();

  const article = postData || MOCK_POST_FALLBACK;

  const articlePreset = useMemo(
    () => getArticleBackgroundPreset(article.id || slug),
    [article.id, slug]
  );

  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showActionBar, setShowActionBar] = useState(false);
  const [ripples, setRipples] = useState<LikeRipple[]>([]);

  // Synchronize component state with fresh server-side article attributes
  useEffect(() => {
    if (article) {
      const timer = setTimeout(() => {
        setIsLiked(article.isLiked || false);
        setLikesCount(article.likesCount || 0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [article]);

  // Handle scroll trigger for Action Bar display
  useEffect(() => {
    const handleScroll = () => {
      setShowActionBar(window.scrollY > 150);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLike = async () => {
    const nextLiked = !isLiked;

    // Expand concentric water-like ripples of gold and rose light if liked
    if (nextLiked) {
      const newRipples = [
        {
          id: Date.now() + 1,
          color: "var(--accent)", // Premium Gold/Amber
          delay: 0,
          maxScale: 3.5,
        },
        {
          id: Date.now() + 2,
          color: "#FB7185", // Elegant Rose Pink
          delay: 0.12, // Delayed echo ripple for layered visual richness
          maxScale: 2.8,
        },
      ];
      setRipples(newRipples);

      // Clear ripples state after animation completes
      setTimeout(() => {
        setRipples([]);
      }, 800);
    }

    if (!article.id || article.id === 9999) {
      // Offline/Mock mode support
      setIsLiked(nextLiked);
      setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      return;
    }

    const wasLiked = isLiked;

    // 1. Optimistic UI update
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    // 2. Dispatch the corresponding mutation to backend
    try {
      if (wasLiked) {
        await unlikePost(article.id).unwrap();
      } else {
        await likePost(article.id).unwrap();
      }
    } catch (err) {
      console.error("Like interaction failed:", err);

      // Rollback to previous state on error
      setIsLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : Math.max(0, prev - 1)));

      toast.danger("Authentication required. Please log in to like this post!");
    }
  };

  const parsedContent = useMemo<JSONContent | undefined>(() => {
    if (!article?.content) return undefined;
    try {
      const doc = JSON.parse(article.content);

      interface TiptapNode {
        type: string;
        text?: string;
        attrs?: Record<string, unknown>;
        content?: TiptapNode[];
      }

      let headingIndex = 0;
      // Recursive pre-processor to inject missing IDs to headings in isReadOnly mode
      const injectHeadingIds = (node: TiptapNode) => {
        if (node.type === "heading") {
          headingIndex++;
          const text = node.content?.[0]?.text || "section";
          let generatedId = text
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
            .replace(/(^-|-$)/g, "");

          if (!generatedId || generatedId === "-") {
            generatedId = `section-${headingIndex}`;
          }

          if (!node.attrs) {
            node.attrs = {};
          }
          if (!node.attrs.id) {
            node.attrs.id = generatedId;
            node.attrs["data-toc-id"] = generatedId;
          }
        }
        if (node.content && Array.isArray(node.content)) {
          node.content.forEach((n: unknown) => injectHeadingIds(n as TiptapNode));
        }
      };

      if (doc && doc.type === "doc" && Array.isArray(doc.content)) {
        doc.content.forEach((n: unknown) => injectHeadingIds(n as TiptapNode));
      }
      return doc as JSONContent;
    } catch (error) {
      console.error("[READER-DEBUG] Parsing content failed:", error);
      return undefined;
    }
  }, [article]);

  console.log("[READER-DEBUG] article loaded:", article ? "yes" : "no", "slug:", slug);

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary size-10 animate-spin rounded-full border-2 border-t-transparent" />
          <Typography type="body-sm" color="muted">
            Opening investor journal...
          </Typography>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <div className="w-[420px]">
          <EmptyState className="border-border rounded-2xl border border-dashed p-6">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="lucide:book-x" className="size-6 text-zinc-400" />
              </EmptyState.Media>
              <EmptyState.Title>Article Not Found</EmptyState.Title>
              <EmptyState.Description>
                The blog post you are looking for could not be found or has not been published yet.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button size="sm" variant="secondary" onPress={() => router.push("/test/blog")}>
                Back to Journal
              </Button>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <Surface variant="transparent" className="relative min-h-screen w-full overflow-hidden">
      {/* 🌌 Ambient Aesthetic Background Systems (Dynamic Preset-driven Morphing Auras) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Slow Morphing Floating Aura A */}
        <motion.div
          className="absolute rounded-full blur-[140px]"
          style={{
            backgroundColor: articlePreset.colors[0],
            width: "55rem",
            height: "55rem",
            top: "-12rem",
            left: "-12rem",
          }}
          animate={{
            x: [0, 50, -40, 0],
            y: [0, -30, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Slow Morphing Floating Aura B */}
        <motion.div
          className="absolute rounded-full blur-[150px]"
          style={{
            backgroundColor: articlePreset.colors[1],
            width: "48rem",
            height: "48rem",
            top: "32rem",
            right: "-12rem",
          }}
          animate={{
            x: [0, -60, 45, 0],
            y: [0, 40, -40, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* 🏁 Distraction-Free Refined Dot Grid Overlay */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-[0.22]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            color: "var(--default-200)",
            maskImage:
              "linear-gradient(to bottom, black 15%, rgba(0,0,0,0.4) 45%, transparent 80%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 15%, rgba(0,0,0,0.4) 45%, transparent 80%)",
          }}
        />
      </div>

      <MotionSeparator
        className="bg-accent fixed top-0 right-0 left-0 z-50 h-0.5 origin-left"
        style={{ scaleX: scrollYProgress }}
        aria-label="Reading progress"
      />

      {/* <div className="mb-10 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-full"
            onPress={() => router.push("/")}
            aria-label="Back to main page"
          >
            <Icon icon="lucide:arrow-left" className="size-4" />
            Back to Journal
          </Button>
        </div> */}

      <div className="relative z-10 mx-auto max-w-3xl pt-12 pb-24">
        {/* 🧭 Back Navigation Header Link (Choreographed Entrance 1) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mb-10 flex items-center justify-between"
        >
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-default-100 gap-1.5 rounded-full"
            onPress={() => router.push("/blog")}
            aria-label="Back to blog"
          >
            <Icon icon="lucide:arrow-left" className="size-3.5" />
            <span className="font-mono text-[10px] font-semibold tracking-widest uppercase">
              CHRONICLE INDEX
            </span>
          </Button>
        </motion.div>

        {/* ✍️ Editorial Header Group (Asymmetric Split Magazine Layout) */}
        <div className="mb-10 flex w-full flex-col items-start">
          {article.category && (
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.9, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="text-accent mb-4 block font-mono text-[9px] font-bold tracking-[0.18em] uppercase"
            >
              {article.category.name}
            </motion.span>
          )}

          {/* Majestic Title Lens-Focus Blur Swell Reveal (Choreographed Entrance 2) */}
          <motion.h1
            initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.26 }}
            className="text-foreground font-display mb-8 w-full text-4xl leading-[1.12] font-bold tracking-tight sm:text-5xl"
          >
            {article.title}
          </motion.h1>

          {/* Split Info Grid (Left: Stacked Meta, Right: Abstract Summary) (Choreographed Entrance 3) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.42 }}
            className="border-default-100/40 grid w-full grid-cols-1 gap-8 border-t pt-6 pb-4 md:grid-cols-12"
          >
            {/* Left Column: Stacked Monospace Metadata Block */}
            <div className="flex flex-col gap-4 select-none md:col-span-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-default-400 text-[9px] font-bold tracking-widest uppercase">
                  Written By
                </span>
                <span className="text-foreground text-sm font-semibold">
                  {article.authorName || "Odysseus"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-default-400 text-[9px] font-bold tracking-widest uppercase">
                  Published
                </span>
                <time className="text-default-500 font-mono text-xs">
                  {new Date(article.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <div className="text-default-500 flex items-center gap-1.5 font-mono text-xs">
                <Icon icon="lucide:book-open" className="text-accent size-3.5" />
                <span>
                  {article.content ? Math.max(1, Math.ceil(article.content.length / 800)) : 1} min
                  read
                </span>
              </div>
            </div>

            {/* Right Column: Abstract Summary with Gold Ribbon Accent */}
            <div className="border-default-100/40 flex flex-col justify-start border-l pl-6 md:col-span-8 md:pl-8">
              <span className="text-accent mb-3 text-[9px] font-bold tracking-widest uppercase">
                Abstract
              </span>
              <p className="text-default-500 dark:text-default-400 text-sm leading-relaxed font-medium italic md:text-base">
                {article.summary
                  ? `“${article.summary}”`
                  : "No abstract provided for this chronicle entry."}
              </p>
            </div>
          </motion.div>

          {/* Elegant Base Divider Horizontal Expansion (Choreographed Entrance 4) */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.52 }}
            className="from-default-100/10 via-default-100/50 to-default-100/10 mt-8 h-px w-full origin-center bg-gradient-to-r"
          />
        </div>

        {/* Core Article Prose Text (Choreographed Entrance 5) */}
        <MotionRichTextEditor
          key={article.content}
          isReadOnly
          extensions={ExtensionKit}
          defaultValue={parsedContent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.62 }}
          style={{ willChange: "opacity" }}
        >
          <RichTextEditor.Shell className="border-none bg-transparent">
            <RichTextEditor.Content />
            <RichTextTableOfContents placement="right" />
          </RichTextEditor.Shell>
        </MotionRichTextEditor>

        {/* ☕ Minimalist Editorial Sign-off (Choreographed Entrance 6) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 1.2 }}
          className="text-default-300/40 my-16 flex items-center justify-center font-mono text-xs tracking-[0.25em] select-none"
        >
          • &nbsp; • &nbsp; •
        </motion.div>

        {/* 💬 Integrated Comment and Dialogue System */}
        <div className="border-default-100/50 mt-16 border-t pt-12">
          <CommentSystem postId={article.id} />
        </div>
      </div>

      <ActionBar isOpen={showActionBar} aria-label="Reading Controls">
        <ActionBar.Prefix>
          <Tooltip delay={100}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => router.push("/blog")}
              aria-label="Back to blog"
            >
              <Icon icon="lucide:arrow-left" className="size-4" />
            </Button>
            <Tooltip.Content>Back to Archive</Tooltip.Content>
          </Tooltip>
        </ActionBar.Prefix>

        <Separator orientation="vertical" />

        <ActionBar.Content>
          <motion.div whileTap={{ scale: 0.95 }} className="inline-flex">
            <Button
              size="sm"
              variant={isLiked ? "danger" : "ghost"}
              onPress={handleLike}
              isPending={isLiking || isUnliking}
              aria-label="Like post"
              className="relative overflow-visible rounded-full"
            >
              {({ isPending }) => (
                <>
                  {/* 🌊 Concentric Liquid Ripples */}
                  {ripples.map((ripple) => (
                    <motion.span
                      key={ripple.id}
                      className="pointer-events-none absolute z-10 rounded-full border border-current"
                      style={{
                        width: 24,
                        height: 24,
                        color: ripple.color,
                        left: "50%",
                        top: "50%",
                        marginLeft: -12,
                        marginTop: -12,
                      }}
                      initial={{ scale: 0.5, opacity: 0.8, borderWidth: 3 }}
                      animate={{ scale: ripple.maxScale, opacity: 0, borderWidth: 0 }}
                      transition={{
                        duration: 0.6,
                        ease: [0.1, 0.8, 0.3, 1], // Custom ultra-smooth cubic-bezier deceleration
                        delay: ripple.delay,
                      }}
                    />
                  ))}

                  {/* ✨ Soft Radial Glow backdrop */}
                  {isLiked && (
                    <motion.span
                      key={`glow-${likesCount}`}
                      className="pointer-events-none absolute z-0 rounded-full bg-rose-500/10 blur-md"
                      style={{
                        width: 32,
                        height: 32,
                        left: "50%",
                        top: "50%",
                        marginLeft: -16,
                        marginTop: -16,
                      }}
                      initial={{ scale: 0.4, opacity: 1 }}
                      animate={{ scale: 2.8, opacity: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                    />
                  )}

                  {isPending ? (
                    <Spinner color="current" size="sm" className="mr-1.5" />
                  ) : (
                    <motion.span
                      animate={{ scale: isLiked ? 1.25 : 1, rotate: isLiked ? -12 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 12,
                      }}
                      className="mr-1.5 flex items-center justify-center"
                    >
                      <Icon
                        icon="lucide:heart"
                        className={cn(
                          "size-3.5 transition-transform",
                          isLiked && "scale-110 fill-rose-500"
                        )}
                      />
                    </motion.span>
                  )}
                  <span className="action-bar__label font-mono text-xs font-semibold">
                    {likesCount}
                  </span>
                </>
              )}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }} className="inline-flex">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Article link copied successfully!");
              }}
              className="hover:bg-accent/10 hover:text-accent-600 rounded-full transition-all duration-300"
            >
              <Icon icon="lucide:share-2" className="mr-1.5 size-3.5" />
              <span className="action-bar__label text-xs font-semibold">Share</span>
            </Button>
          </motion.div>
        </ActionBar.Content>

        <Separator orientation="vertical" />

        <ActionBar.Suffix>
          <Tooltip delay={100}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Scroll to top"
            >
              <Icon icon="lucide:arrow-up" className="size-4" />
            </Button>
            <Tooltip.Content>Scroll to top</Tooltip.Content>
          </Tooltip>
        </ActionBar.Suffix>
      </ActionBar>
    </Surface>
  );
}

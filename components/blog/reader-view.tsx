"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Avatar, Chip, Typography, Card } from "@heroui/react";
import { RichTextEditor, EmptyState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import type { JSONContent } from "@tiptap/react";
import { useGetPublicPostBySlugQuery } from "@/lib/features/post/post-api";
import { RichTextTableOfContents } from "@/components/rich-text/table-of-contents";
import { ExtensionKit } from "@/components/rich-text/extensions/extension-kit";

interface ReaderViewProps {
  slug: string;
}

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
  const proseRef = useRef<HTMLDivElement>(null);

  // RTK Query hook for fetching public blog details
  const { data: postData, isLoading } = useGetPublicPostBySlugQuery(slug);

  const [scrollProgress, setScrollProgress] = useState(0);

  const article = postData || MOCK_POST_FALLBACK;

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
          const text = (node.content && node.content[0]?.text) || "section";
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
          if (!node.attrs["id"]) {
            node.attrs["id"] = generatedId;
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
  if (article) {
    console.log("[READER-DEBUG] raw content length:", article.content ? article.content.length : 0);
    console.log("[READER-DEBUG] raw content value (string):", article.content);
    console.log("[READER-DEBUG] parsedContent value:", parsedContent);
  }

  // 1. Reading Progress Bar Logic
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className="bg-background text-foreground relative min-h-screen pb-32">
      {/* 🔴 Top reading progress bar */}
      <div
        className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={scrollProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-6 pt-24 lg:px-12">
        {/* Back navigation and Mode Badges */}
        <div className="mb-10 flex items-center justify-between">
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
        </div>

        {/* 🖼️ Premium Full-Width Cover Image Header (As per Bento/Cinematic Standard) */}
        <div className="border-border/10 relative mb-12 aspect-[21/9] w-full overflow-hidden rounded-3xl border bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:from-black dark:via-zinc-950 dark:to-black">
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          ) : (
            // Modern, cinematic abstract background when cover image is null
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div className="absolute -top-12 -left-12 size-96 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="absolute -right-12 -bottom-12 size-96 rounded-full bg-teal-500/5 blur-3xl" />
              <div className="z-10 flex flex-col items-center gap-2 opacity-30 select-none">
                <Icon icon="lucide:book-open" className="size-12 text-zinc-400" />
                <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  Odyssey Journal
                </span>
              </div>
            </div>
          )}
          {/* Elegant overlay gradient to increase visual richness */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          {/* 👈 Left Column: Tactile Bento-Style Meta Card (lg:col-span-3) */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-3">
            <Card variant="secondary" className="border-border/30 border p-5 shadow-none">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase select-none">
                  Classification
                </span>
                {article.category && (
                  <Chip
                    size="sm"
                    variant="soft"
                    color="accent"
                    className="max-w-fit font-bold tracking-wider uppercase"
                  >
                    {article.category.name}
                  </Chip>
                )}

                <div className="bg-border/10 my-1 h-px" />

                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase select-none">
                  Author & Date
                </span>
                <div className="flex items-center gap-3">
                  <Avatar size="sm" color="default" className="border-border/40 size-8 border">
                    <Avatar.Fallback className="font-bold">
                      {article.authorName ? article.authorName.slice(0, 2).toUpperCase() : "OD"}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Typography type="body-xs" weight="semibold" className="text-foreground">
                      {article.authorName}
                    </Typography>
                    <Typography type="body-xs" color="muted" className="mt-0.5 text-[10px]">
                      {new Date(article.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  </div>
                </div>

                <div className="bg-border/10 my-1 h-px" />

                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase select-none">
                  Engagement
                </span>
                <div className="text-muted flex flex-col gap-2.5 text-xs font-medium">
                  <span className="flex items-center gap-2">
                    <Icon icon="lucide:eye" className="text-default-400 size-4" />
                    <span className="font-mono">{article.views} views</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon icon="lucide:heart" className="size-4 fill-rose-500/10 text-rose-500" />
                    <span className="font-mono">{article.likesCount} likes</span>
                  </span>
                </div>

                {article.tags && article.tags.length > 0 && (
                  <>
                    <div className="bg-border/10 my-1 h-px" />
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase select-none">
                      Keywords
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      {article.tags.map((t) => (
                        <Chip
                          key={t.name}
                          size="sm"
                          variant="secondary"
                          className="h-6 px-2 text-[10px]"
                        >
                          #{t.name}
                        </Chip>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* 📄 Middle Column: Core Prose Text (lg:col-span-9) */}
          <main className="lg:col-span-9">
            <article className="flex flex-col">
              <Typography
                type="h1"
                className="text-foreground mb-6 text-3xl leading-tight font-extrabold tracking-tight lg:text-4xl"
              >
                {article.title}
              </Typography>

              {article.summary && (
                <div className="text-foreground/80 border-border/10 mb-8 border-b pb-8 text-lg leading-relaxed font-medium italic">
                  &ldquo;{article.summary}&rdquo;
                </div>
              )}

              {/* The reading content wrapper */}
              <div ref={proseRef} className="blog-prose text-foreground/90 max-w-none font-sans">
                <style>{`
                  .blog-prose .rich-text-editor,
                  .blog-prose .rich-text-editor__shell,
                  .blog-prose .rich-text-editor__content,
                  .blog-prose .tiptap,
                  .blog-prose .ProseMirror {
                    height: auto !important;
                    min-height: unset !important;
                    overflow: visible !important;
                  }
                `}</style>
                <RichTextEditor
                  isReadOnly
                  extensions={ExtensionKit}
                  defaultValue={parsedContent}
                  key={article.content}
                >
                  <RichTextEditor.Shell>
                    <RichTextEditor.Content />

                    {/* 🎯 Integrated reusable modular Floating TOC */}
                    <RichTextTableOfContents placement="right" />
                  </RichTextEditor.Shell>
                </RichTextEditor>
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Calendar, Clock } from "@gravity-ui/icons";
import { Avatar, Chip, Link, Tag, TagGroup, Typography } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ArticleAmbientBackground } from "@/features/blog/reader/article-ambient-background";
import { type PostResponse } from "@/lib/features/post";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";
import { useArticleReadingMinutes } from "./article-outline";

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;
const REVEAL_DURATION = 0.8;
const REVEAL_GAP = 0.1;

function MaskReveal({
  children,
  className,
  index,
}: {
  children: ReactNode;
  className?: string;
  index: number;
}) {
  const reduced = useReducedMotion();

  return (
    <div className={`overflow-hidden pb-[0.08em] ${className ?? ""}`}>
      <motion.div
        initial={reduced ? false : { y: "110%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: REVEAL_DURATION, delay: index * REVEAL_GAP, ease: REVEAL_EASE }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getAuthorInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ArticleHero({ article }: { article: PostResponse }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Article");
  const authorName = article.authorName?.trim() || "Odyssey";
  const publishedAt = getPostPublishedAt(article);
  const minutes = useArticleReadingMinutes();
  const category = article.category;
  const tags = article.tags ?? [];

  const publishedLabel = formatDate(publishedAt, locale, t("recentlyPublished"));

  const titleIndex = category ? 1 : 0;
  const summaryIndex = titleIndex + (article.summary ? 1 : 0);
  const metaIndex = summaryIndex + 1;
  const tagsIndex = metaIndex + 1;

  return (
    <header className="relative mb-12 w-full max-w-none md:mb-16">
      <ArticleAmbientBackground presetId={article.shaderPreset} slug={article.slug} />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pt-28 pb-8 text-center md:pt-32">
        {category ? (
          <MaskReveal index={0}>
            <Chip size="sm" variant="soft">
              <Link href={`/single/categories/${encodeURIComponent(category.slug)}`}>
                {category.name}
              </Link>
            </Chip>
          </MaskReveal>
        ) : null}

        <MaskReveal className="mt-6" index={titleIndex}>
          <h1 className="max-w-2xl text-4xl leading-[1.15] font-semibold text-balance wrap-break-word sm:text-5xl">
            {article.title}
          </h1>
        </MaskReveal>

        {article.summary ? (
          <MaskReveal className="mt-5" index={summaryIndex}>
            <p className="text-muted max-w-xl text-base leading-7 text-pretty sm:text-lg">
              {article.summary}
            </p>
          </MaskReveal>
        ) : null}

        <MaskReveal className="mt-8" index={metaIndex}>
          <div className="flex flex-col items-center gap-3">
            {article.authorName?.trim() ? (
              <Link
                className="flex items-center gap-2 no-underline"
                href={`/single/authors/${encodeURIComponent(article.authorName.trim())}`}
              >
                <Avatar size="sm">
                  {article.authorAvatar ? (
                    <Avatar.Image alt={authorName} src={article.authorAvatar} />
                  ) : null}
                  <Avatar.Fallback>{getAuthorInitials(authorName)}</Avatar.Fallback>
                </Avatar>
                <span className="text-foreground text-sm font-medium">{authorName}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <Avatar.Fallback>{getAuthorInitials(authorName)}</Avatar.Fallback>
                </Avatar>
                <Typography className="font-medium" type="body-sm">
                  {authorName}
                </Typography>
              </div>
            )}
            <div className="text-muted flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <time dateTime={publishedAt ?? undefined}>{publishedLabel}</time>
              </span>
              {minutes == null ? null : (
                <MaskReveal index={0}>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Clock className="size-3.5" />
                      {t("minRead", { count: minutes })}
                    </span>
                  </span>
                </MaskReveal>
              )}
            </div>
          </div>
        </MaskReveal>

        {tags.length > 0 ? (
          <MaskReveal className="mt-4" index={tagsIndex}>
            <TagGroup
              aria-label={t("tags")}
              selectionMode="single"
              size="sm"
              variant="surface"
              onSelectionChange={(keys) => {
                if (keys === "all") return;
                const slug = [...keys][0];
                if (slug == null) return;
                router.push(`/single/tags/${encodeURIComponent(String(slug))}`);
              }}
            >
              <TagGroup.List className="justify-center">
                {tags.map((tag) => (
                  <Tag key={tag.id} id={tag.slug} textValue={tag.name}>
                    {tag.name}
                  </Tag>
                ))}
              </TagGroup.List>
            </TagGroup>
          </MaskReveal>
        ) : null}
      </div>
    </header>
  );
}

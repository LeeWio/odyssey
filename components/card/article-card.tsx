"use client";

import { Icon } from "@iconify/react";
import { Avatar, Button, Card, Chip, Dropdown, Label, Popover, toast } from "@heroui/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { ArticleCover } from "@/components/card/article-cover";
import { useReadingListAction } from "@/features/library/reading-list-button";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import { useGetReadingListMembershipQuery } from "@/lib/features/library";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "@/lib/hooks";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";

export interface ArticleCardPost {
  id?: number;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  coverImage?: string | null;
  shaderPreset?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  category?: { name?: string | null } | null;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  isInReadingList?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string | null;
}

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ArticleAuthor({
  post,
  publishedAt,
}: {
  post: ArticleCardPost;
  publishedAt: string | null;
}) {
  const t = useTranslations("ArticleCard");
  const article = useTranslations("Article");
  const locale = useLocale();
  const name = post.authorName?.trim();
  const author = name || t("unknownAuthor");
  const initials = author.slice(0, 2).toUpperCase();
  const date = formatDate(publishedAt, locale, article("recentlyPublished"));
  const byline = (
    <div className="flex items-center gap-2">
      <Avatar size="sm">
        {post.authorAvatar ? <Avatar.Image alt={author} src={post.authorAvatar} /> : null}
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="text-sm font-medium">{author}</p>
        <time className="text-muted text-xs" dateTime={publishedAt || undefined}>
          {date}
        </time>
      </div>
    </div>
  );

  if (!name) return byline;

  return (
    <Popover>
      <Popover.Trigger aria-label={t("authorProfile", { author })}>{byline}</Popover.Trigger>
      <Popover.Content className="w-80 max-w-[calc(100vw-2rem)]">
        <Popover.Dialog>
          <Popover.Heading>{author}</Popover.Heading>
          <Link
            className="text-accent mt-2 inline-block text-sm"
            href={`/single/authors/${encodeURIComponent(name)}`}
          >
            {t("authorArticles")}
          </Link>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export function ArticleCard({
  animatedCover = false,
  layout = "row",
  post,
}: {
  animatedCover?: boolean;
  layout?: "row" | "tile";
  post: ArticleCardPost;
}) {
  const t = useTranslations("Journal");
  const title = post.title || t("untitledStory");
  const slug = post.slug || "";
  const href = slug ? `/single/${encodeURIComponent(slug)}` : "/single";
  const seed = String(post.id ?? post.slug ?? title);
  const publishedAt = getPostPublishedAt(post);

  return (
    <Card
      aria-label={title}
      className={
        layout === "tile"
          ? "h-full w-full overflow-hidden p-0 shadow-sm"
          : "w-full max-w-xl overflow-hidden shadow-sm md:flex-row md:items-stretch"
      }
      role="article"
    >
      <div
        className={
          layout === "tile"
            ? "relative isolate aspect-[16/10] w-full overflow-hidden"
            : "relative isolate min-h-56 w-full shrink-0 overflow-hidden rounded-2xl sm:min-h-64 md:min-h-0 md:w-48 lg:w-52"
        }
      >
        <ArticleCover
          animated={animatedCover}
          presetId={post.shaderPreset}
          seed={seed}
          src={post.coverImage}
        />
        {post.category?.name ? (
          <Chip className="absolute top-3 left-3" size="sm">
            {post.category.name}
          </Chip>
        ) : null}
      </div>

      <div
        className={
          layout === "tile" ? "flex flex-1 flex-col gap-3 p-5" : "flex flex-1 flex-col gap-3"
        }
      >
        <Card.Header className="gap-1">
          <Card.Title className="text-foreground max-w-xl pe-8 text-xl leading-tight font-bold text-pretty sm:text-2xl">
            <Link
              className="text-foreground hover:text-accent no-underline"
              href={href}
              prefetch={false}
            >
              {title}
            </Link>
          </Card.Title>
          {post.summary ? (
            <Card.Description className="text-muted line-clamp-2 max-w-xl text-sm leading-5">
              {post.summary}
            </Card.Description>
          ) : null}
        </Card.Header>

        <Card.Footer className="mt-auto w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ArticleAuthor post={post} publishedAt={publishedAt} />
          <ArticleCardActions post={post} href={href} />
        </Card.Footer>
      </div>
    </Card>
  );
}

function ArticleCardActions({ post, href }: { post: ArticleCardPost; href: string }) {
  const username = useAppSelector(selectCurrentUser);
  return <ArticleCardMenu key={`${username ?? "guest"}:${href}`} post={post} href={href} />;
}

function ArticleCardMenu({ post, href }: { post: ArticleCardPost; href: string }) {
  const t = useTranslations("Article");
  const card = useTranslations("ArticleCard");
  const [isOpen, setIsOpen] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const canSave = post.id != null;
  const details = useGetReadingListMembershipQuery(
    isAuthenticated && username && post.id != null && isOpen
      ? { username, postId: post.id }
      : skipToken,
    { refetchOnMountOrArgChange: true }
  );
  const hasMembership = typeof details.currentData === "boolean";
  const isChecking = isAuthenticated && canSave && (details.isFetching || details.isUninitialized);
  const { saved, busy, toggle } = useReadingListAction({
    postId: post.id,
    isSaved: details.currentData === true,
    isRefreshing: isChecking,
  });
  const saveLabel = isChecking
    ? card("checking")
    : isAuthenticated && details.isError
      ? card("retrySave")
      : saved
        ? card("removeSaved")
        : t("saveForLater");

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).href);
      setIsShared(true);
      window.setTimeout(() => setIsShared(false), 1800);
    } catch {
      setIsShared(false);
      toast.danger(t("linkCopyFailed"));
    }
  }

  const disabledKeys = [
    ...(!canSave || busy || (isAuthenticated && !hasMembership && !details.isError)
      ? ["save-article"]
      : []),
    ...(!post.slug ? ["copy-link"] : []),
  ];

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        aria-label={isShared ? card("copied") : card("share")}
        isDisabled={!post.slug}
        isIconOnly
        size="sm"
        onPress={() => void handleShare()}
      >
        <Icon
          aria-hidden="true"
          className="size-4"
          icon={isShared ? "lucide:check" : "lucide:send"}
        />
      </Button>
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button aria-label={card("actions")} isIconOnly size="sm" variant="outline">
          <Icon aria-hidden="true" className="size-4" icon="lucide:ellipsis" />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            disabledKeys={disabledKeys}
            onAction={(key) => {
              if (key === "copy-link") void handleShare();
              if (key === "save-article") {
                if (details.isError) void details.refetch();
                else void toggle();
              }
            }}
          >
            <Dropdown.Item id="save-article" textValue={saveLabel}>
              <Icon aria-hidden="true" className="text-muted size-4" icon="lucide:bookmark" />
              <Label>{saveLabel}</Label>
            </Dropdown.Item>
            <Dropdown.Item id="copy-link" textValue={card("copy")}>
              <Icon aria-hidden="true" className="text-muted size-4" icon="lucide:link" />
              <Label>{card("copy")}</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

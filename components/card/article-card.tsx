"use client";

import { Icon } from "@iconify/react";
import { Avatar, Button, Card, Chip, Dropdown, Label, Link, Popover } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ArticleCover } from "@/components/card/article-cover";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";

export interface ArticleCardPost {
  id?: number;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  coverImage?: string | null;
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
  const [isFollowing, setIsFollowing] = useState(false);
  const author = post.authorName || "Anonymous";
  const initials = author.slice(0, 2).toUpperCase();

  return (
    <Popover>
      <Popover.Trigger aria-label={`View ${author}'s profile`}>
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            {post.authorAvatar ? <Avatar.Image alt={author} src={post.authorAvatar} /> : null}
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{author}</p>
            <time className="text-muted text-xs" dateTime={publishedAt || undefined}>
              {formatDate(publishedAt, "en-US", "Recently published")}
            </time>
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Content className="w-80 max-w-[calc(100vw-2rem)]">
        <Popover.Dialog>
          <Popover.Heading>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size="md">
                  {post.authorAvatar ? <Avatar.Image alt={author} src={post.authorAvatar} /> : null}
                  <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{author}</p>
                  <p className="text-muted text-sm">
                    {formatDate(publishedAt, "en-US", "Recently published")}
                  </p>
                </div>
              </div>
              <Button
                className="rounded-full"
                size="sm"
                variant={isFollowing ? "tertiary" : "primary"}
                onPress={() => setIsFollowing((following) => !following)}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </Popover.Heading>
          <p className="text-muted mt-3 text-sm">Discover more writing from {author}.</p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export function ArticleCard({ post }: { post: ArticleCardPost }) {
  const t = useTranslations("Journal");
  const title = post.title || t("untitledStory");
  const slug = post.slug || "";
  const href = slug ? `/single/${slug}` : "/single";
  const seed = String(post.id ?? post.slug ?? title);
  const publishedAt = getPostPublishedAt(post);
  const [isShared, setIsShared] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      // Clipboard access is unavailable in some preview environments.
    }
    setIsShared(true);
    window.setTimeout(() => setIsShared(false), 1800);
  }

  return (
    <Card
      aria-label={title}
      className="w-full max-w-xl overflow-hidden shadow-sm md:flex-row md:items-stretch"
      role="article"
    >
      <div className="relative isolate min-h-56 w-full shrink-0 overflow-hidden rounded-2xl sm:min-h-64 md:min-h-0 md:w-48 lg:w-52">
        <ArticleCover seed={seed} />
        {post.category?.name ? (
          <Chip className="absolute top-3 left-3" size="sm">
            {post.category.name}
          </Chip>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <Card.Header className="gap-1">
          <Card.Title className="text-foreground max-w-xl pe-8 text-xl leading-tight font-bold text-pretty sm:text-2xl">
            <Link className="text-foreground hover:text-accent no-underline" href={href}>
              {title}
            </Link>
          </Card.Title>
          {post.summary ? (
            <Card.Description className="text-muted line-clamp-2 max-w-xl text-sm leading-5">
              {post.summary}
            </Card.Description>
          ) : null}
        </Card.Header>

        <Card.Footer className="mt-auto flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ArticleAuthor post={post} publishedAt={publishedAt} />
          <div className="flex shrink-0 items-center gap-2">
            <Button
              aria-label={isShared ? "Article link copied" : "Share article"}
              isIconOnly
              size="sm"
              onPress={handleShare}
            >
              <Icon
                aria-hidden="true"
                className="size-4"
                icon={isShared ? "lucide:check" : "lucide:send"}
              />
            </Button>
            <Dropdown>
              <Button aria-label="More article actions" isIconOnly size="sm" variant="outline">
                <Icon aria-hidden="true" className="size-4" icon="lucide:ellipsis" />
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "copy-link") void handleShare();
                  }}
                >
                  <Dropdown.Item id="save-article" textValue="Save for later">
                    <Icon aria-hidden="true" className="text-muted size-4" icon="lucide:bookmark" />
                    <Label>Save for later</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="copy-link" textValue="Copy article link">
                    <Icon aria-hidden="true" className="text-muted size-4" icon="lucide:link" />
                    <Label>Copy article link</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </Card.Footer>
      </div>
    </Card>
  );
}

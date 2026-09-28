"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Avatar, Button, Card, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { type PostResponse, usePublishedCatalog } from "@/lib/features/post";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

type AuthorCard = {
  avatar?: string | null;
  categories: string[];
  count: number;
  latest?: PostResponse;
  name: string;
  views: number;
};

function collectAuthors(posts: PostResponse[]) {
  const authors = new Map<string, AuthorCard>();

  for (const post of posts) {
    const name = post.authorName?.trim();
    if (!name) continue;
    const current = authors.get(name) ?? {
      avatar: post.authorAvatar,
      categories: [],
      count: 0,
      latest: post,
      name,
      views: 0,
    };
    const category = post.category?.name;
    authors.set(name, {
      ...current,
      avatar: current.avatar || post.authorAvatar,
      categories: category
        ? [...new Set([...current.categories, category])].slice(0, 3)
        : current.categories,
      count: current.count + 1,
      views: current.views + (post.views ?? 0),
    });
  }

  return [...authors.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export default function AuthorsPage() {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const catalog = usePublishedCatalog();
  const list = collectAuthors(catalog.posts);

  return (
    <div className="bg-background min-h-[100dvh] w-full px-8 pt-28 pb-24 md:px-12 xl:px-16">
      <div className="flex w-full flex-col gap-10">
        <header className="flex max-w-2xl flex-col gap-2">
          <Link className="text-sm no-underline" href="/single">
            {t("title")}
          </Link>
          <Typography type="h1" weight="semibold">
            {t("authorsTitle")}
          </Typography>
          <Typography color="muted">{t("authorsDescription")}</Typography>
        </header>

        {catalog.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : catalog.isError ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>{t("latestFailed")}</EmptyState.Title>
              <EmptyState.Description>{t("latestFailedHint")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button size="sm" variant="secondary" onPress={catalog.retry}>
                {t("tryAgain")}
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : list.length === 0 ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>{t("emptyTitle")}</EmptyState.Title>
              <EmptyState.Description>{t("emptyDescription")}</EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((author) => (
              <li key={author.name}>
                <Card className="h-full">
                  <Card.Header>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {author.avatar ? <Avatar.Image alt="" src={author.avatar} /> : null}
                        <Avatar.Fallback>{initials(author.name)}</Avatar.Fallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Card.Title>
                          <Link
                            className="text-foreground no-underline"
                            href={`/single/authors/${encodeURIComponent(author.name)}`}
                          >
                            {author.name}
                          </Link>
                        </Card.Title>
                        <Card.Description>
                          <NumberValue locale={locale} value={author.count}>
                            {(formatted) => t("authorEssays", { count: formatted })}
                          </NumberValue>
                          {" · "}
                          <NumberValue locale={locale} notation="compact" value={author.views}>
                            {(formatted) => t("views", { count: formatted })}
                          </NumberValue>
                        </Card.Description>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content className="flex flex-col gap-2">
                    {author.categories.length > 0 ? (
                      <p className="text-muted text-xs">{author.categories.join(" · ")}</p>
                    ) : null}
                    {author.latest ? (
                      <>
                        <p className="text-muted text-xs">{t("latestEssay")}</p>
                        <Link
                          className="text-foreground line-clamp-2 text-base leading-6 font-medium no-underline"
                          href={author.latest.slug ? `/single/${author.latest.slug}` : "/single"}
                        >
                          {author.latest.title || t("untitledStory")}
                        </Link>
                        {author.latest.summary ? (
                          <p className="text-muted line-clamp-3 text-sm leading-5">
                            {author.latest.summary}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </Card.Content>
                  <Card.Footer>
                    <Link href={`/single/authors/${encodeURIComponent(author.name)}`}>
                      {author.name}
                      <Link.Icon />
                    </Link>
                  </Card.Footer>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

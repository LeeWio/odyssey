"use client";

import { EmptyState, ItemCard, NumberValue } from "@heroui-pro/react";
import { Avatar, Button, Card, Link, Separator, Skeleton, Typography } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";

import { type PostResponse, useGetPublicPostsQuery } from "@/lib/features/post";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";
import { useNormalizePageParam } from "@/lib/hooks/use-normalize-page-param";

import { EssayPagination } from "../../components/essay-pagination";
import { parsePageParam } from "@/lib/utils/pagination";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function EssayRow({ lead = false, post }: { lead?: boolean; post: PostResponse }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const cover = post.coverImage?.trim();

  return (
    <ItemCard className="items-start p-3" variant="secondary">
      {cover ? (
        <ItemCard.Icon className="size-20 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="size-20 object-cover" src={cover} />
        </ItemCard.Icon>
      ) : null}
      <ItemCard.Content className="gap-1.5">
        <ItemCard.Title
          className={lead ? "text-xl leading-7 font-semibold" : "text-base leading-6 font-semibold"}
        >
          <Link
            className="text-foreground line-clamp-2 no-underline"
            href={post.slug ? `/single/${post.slug}` : "/single"}
          >
            {post.title || t("untitledStory")}
          </Link>
        </ItemCard.Title>
        <p className="text-muted text-xs">
          {[post.category?.name, formatDate(getPostPublishedAt(post), locale)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {post.summary ? (
          <p className={`text-muted text-sm leading-5 ${lead ? "line-clamp-4" : "line-clamp-3"}`}>
            {post.summary}
          </p>
        ) : null}
        <p className="text-muted text-xs tabular-nums">
          <NumberValue locale={locale} notation="compact" value={post.views ?? 0}>
            {(formatted) => t("views", { count: formatted })}
          </NumberValue>
          {" · "}
          <NumberValue locale={locale} notation="compact" value={post.likesCount ?? 0}>
            {(formatted) => t("likes", { count: formatted })}
          </NumberValue>
        </p>
      </ItemCard.Content>
    </ItemCard>
  );
}

export default function AuthorPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const author = decodeURIComponent(name);
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get("page"));
  const posts = useGetPublicPostsQuery({ authorName: author, page: page - 1, size: 8 });
  useNormalizePageParam(page, posts.currentData ? (posts.currentData.totalPages ?? 0) : undefined);
  const written = posts.data?.list ?? [];
  const avatar = written.find((post) => post.authorAvatar)?.authorAvatar;
  const categories = [
    ...new Map(
      written
        .filter((post) => post.category?.id && post.category.name)
        .map((post) => [post.category!.id, post.category!] as const)
    ).values(),
  ];
  return (
    <div className="bg-background min-h-[100dvh] w-full px-8 pt-28 pb-24 md:px-12 xl:px-16">
      <div className="grid w-full items-start gap-x-16 gap-y-12 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-5">
            <Link className="text-sm no-underline" href="/single/authors">
              {t("allAuthors")}
            </Link>
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {avatar ? <Avatar.Image alt="" src={avatar} /> : null}
                <Avatar.Fallback>{initials(author)}</Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1">
                <Typography type="h1" weight="semibold">
                  {author}
                </Typography>
                <p className="text-muted text-sm tabular-nums">
                  <NumberValue locale={locale} value={posts.data?.total ?? 0}>
                    {(formatted) => t("authorEssays", { count: formatted })}
                  </NumberValue>
                </p>
              </div>
            </div>
          </header>

          {posts.isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : posts.isError ? (
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>{t("latestFailed")}</EmptyState.Title>
                <EmptyState.Description>{t("latestFailedHint")}</EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button size="sm" variant="secondary" onPress={() => void posts.refetch()}>
                  {t("tryAgain")}
                </Button>
              </EmptyState.Content>
            </EmptyState>
          ) : written.length === 0 ? (
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>{t("authorMissing")}</EmptyState.Title>
              </EmptyState.Header>
              <EmptyState.Content>
                <Link href="/single/authors">{t("backToAuthors")}</Link>
              </EmptyState.Content>
            </EmptyState>
          ) : (
            <>
              <ul className="flex flex-col gap-4">
                {written.map((post, index) => (
                  <li key={post.id}>
                    <EssayRow lead={index === 0 && page === 1} post={post} />
                  </li>
                ))}
              </ul>
              <EssayPagination
                onPageChange={(nextPage) => {
                  const query = new URLSearchParams(searchParams.toString());
                  if (nextPage <= 1) query.delete("page");
                  else query.set("page", String(nextPage));
                  const suffix = query.toString();
                  router.replace(
                    `/single/authors/${encodeURIComponent(author)}${suffix ? `?${suffix}` : ""}`,
                    {
                      scroll: true,
                    }
                  );
                }}
                page={page}
                pages={posts.data?.totalPages ?? 0}
              />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-8 xl:sticky xl:top-28 xl:self-start">
          {categories.length > 0 ? (
            <Card variant="secondary">
              <Card.Header>
                <Card.Title className="text-sm">{t("writesAbout")}</Card.Title>
              </Card.Header>
              <Card.Content>
                <ul className="flex flex-col gap-2">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        className="text-foreground text-sm no-underline"
                        href={
                          category.slug
                            ? `/single/categories/${encodeURIComponent(category.slug)}`
                            : "/single/categories"
                        }
                      >
                        {category.name}
                        <Link.Icon />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card.Content>
            </Card>
          ) : null}
          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-sm">{t("otherAuthors")}</Card.Title>
            </Card.Header>
            <Card.Content>
              <Link href="/single/authors">
                {t("allAuthors")}
                <Link.Icon />
              </Link>
            </Card.Content>
          </Card>
          <Separator className="xl:hidden" />
        </aside>
      </div>
    </div>
  );
}

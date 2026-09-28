"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Card, Link, Pagination, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { use, useState } from "react";

import { useGetPublicCategoriesQuery } from "@/lib/features/category";
import { type PostResponse, useGetPublicPostsQuery } from "@/lib/features/post";

const PAGE_SIZE = 8;

function pageNumbers(page: number, totalPages: number) {
  const pages: Array<number | "ellipsis"> = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (page > 3) pages.push("ellipsis");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
  if (page < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

function formatDate(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function EssayCard({ post }: { post: PostResponse }) {
  const t = useTranslations("Journal");
  const locale = useLocale();
  const title = post.title || t("untitledStory");
  const cover = post.coverImage?.trim();

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex items-start gap-3">
          <Card.Title className="line-clamp-2 min-w-0 flex-1 text-base leading-6">
            <Link className="text-foreground no-underline" href={`/single/${post.slug}`}>
              {title}
            </Link>
          </Card.Title>
          {cover ? (
            <Link
              className="block size-12 shrink-0 overflow-hidden rounded-lg no-underline"
              href={`/single/${post.slug}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="size-12 object-cover" src={cover} />
            </Link>
          ) : null}
        </div>
        <Card.Description>
          {[post.authorName, formatDate(post.createdAt, locale, t("recentlyPublished"))]
            .filter(Boolean)
            .join(" · ")}
        </Card.Description>
      </Card.Header>
      {post.summary ? (
        <Card.Content>
          <p className="text-muted line-clamp-2 text-sm leading-5">{post.summary}</p>
        </Card.Content>
      ) : null}
      <Card.Footer className="mt-auto">
        <span className="text-muted text-xs tabular-nums">
          <NumberValue locale={locale} notation="compact" value={post.views}>
            {(formatted) => t("views", { count: formatted })}
          </NumberValue>
          {" · "}
          <NumberValue locale={locale} notation="compact" value={post.likesCount}>
            {(formatted) => t("likes", { count: formatted })}
          </NumberValue>
        </span>
      </Card.Footer>
    </Card>
  );
}

function EssayPagination({
  onPageChange,
  page,
  pages,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pages: number;
}) {
  const t = useTranslations("Journal");
  if (pages <= 1) return null;

  return (
    <div className="w-full overflow-x-auto">
      <Pagination className="justify-center" size="sm">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled={page === 1} onPress={() => onPageChange(page - 1)}>
              <Pagination.PreviousIcon />
              <span>{t("previous")}</span>
            </Pagination.Previous>
          </Pagination.Item>
          {pageNumbers(page, pages).map((item, index) =>
            item === "ellipsis" ? (
              <Pagination.Item key={`ellipsis-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={item}>
                <Pagination.Link isActive={item === page} onPress={() => onPageChange(item)}>
                  {item}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}
          <Pagination.Item>
            <Pagination.Next isDisabled={page === pages} onPress={() => onPageChange(page + 1)}>
              <span>{t("next")}</span>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  );
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations("Journal");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const categories = useGetPublicCategoriesQuery();
  const category = (categories.data ?? []).find((item) => item.slug === decodeURIComponent(slug));
  const posts = useGetPublicPostsQuery(
    { categoryId: category?.id, page: page - 1, size: PAGE_SIZE },
    { skip: !category }
  );
  const totalPages = posts.data?.totalPages ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex max-w-2xl flex-col gap-2">
        <Link className="text-sm no-underline" href="/single/categories">
          {t("allCategories")}
        </Link>
        <Typography type="h1" weight="semibold">
          {category?.name ?? decodeURIComponent(slug)}
        </Typography>
        {category?.description ? (
          <Typography color="muted">{category.description}</Typography>
        ) : null}
        {posts.data ? (
          <span className="text-muted text-sm tabular-nums">
            <NumberValue locale={locale} value={posts.data.total}>
              {(formatted) => t("categoryEssays", { count: formatted })}
            </NumberValue>
          </span>
        ) : null}
      </header>

      {categories.isLoading || (category && posts.isLoading) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : categories.isError || posts.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("latestFailed")}</EmptyState.Title>
            <EmptyState.Description>{t("latestFailedHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                void categories.refetch();
                void posts.refetch();
              }}
            >
              {t("tryAgain")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : !category || (posts.data?.list.length ?? 0) === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("categoryMissing")}</EmptyState.Title>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link href="/single/categories">{t("allCategories")}</Link>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {posts.data?.list.map((post) => (
              <li key={post.id}>
                <EssayCard post={post} />
              </li>
            ))}
          </ul>
          <EssayPagination onPageChange={setPage} page={page} pages={totalPages} />
        </>
      )}
    </div>
  );
}

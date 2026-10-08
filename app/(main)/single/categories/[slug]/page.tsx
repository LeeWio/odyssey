"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { ESSAY_GRID } from "../../components/grid-classes";

import { useGetPublicCategoriesQuery } from "@/lib/features/category";
import { useGetPublicPostsQuery } from "@/lib/features/post";
import { useNormalizePageParam } from "@/lib/hooks/use-normalize-page-param";

import { EssayGrid } from "../../components/essay-grid";
import { EssayPagination } from "../../components/essay-pagination";
import { parsePageParam } from "@/lib/utils/pagination";

const PAGE_SIZE = 8;

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get("page"));
  const categories = useGetPublicCategoriesQuery();
  const category = (categories.data ?? []).find((item) => item.slug === decodeURIComponent(slug));
  const posts = useGetPublicPostsQuery(
    { categoryId: category?.id, page: page - 1, size: PAGE_SIZE },
    { skip: !category }
  );
  const totalPages = posts.data?.totalPages ?? 0;
  useNormalizePageParam(page, posts.currentData ? (posts.currentData.totalPages ?? 0) : undefined);

  return (
    <PageContainer className="flex flex-col gap-8 pt-28 pb-24 lg:pt-32">
      <header className="flex max-w-2xl flex-col gap-2">
        <Link className="text-sm no-underline" href="/single/categories">
          {t("allCategories")}
        </Link>
        <Typography
          type="h1"
          weight="semibold"
          className="tracking-normal text-balance break-words"
        >
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
        <div className={ESSAY_GRID} aria-busy="true">
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
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
          <EssayGrid posts={posts.data?.list ?? []} />
          <EssayPagination
            onPageChange={(nextPage) => {
              const query = new URLSearchParams(searchParams.toString());
              if (nextPage <= 1) query.delete("page");
              else query.set("page", String(nextPage));
              router.replace(`?${query.toString()}`, { scroll: true });
            }}
            page={page}
            pages={totalPages}
          />
        </>
      )}
    </PageContainer>
  );
}

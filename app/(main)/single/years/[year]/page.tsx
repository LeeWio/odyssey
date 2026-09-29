"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Card, Link, Skeleton, Typography } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";

import { useRetrieveArchiveQuery, useRetrieveFacetsQuery } from "@/lib/features/openapi";
import { useNormalizePageParam } from "@/lib/hooks/use-normalize-page-param";
import { EssayGrid } from "../../components/essay-grid";
import { EssayPagination } from "../../components/essay-pagination";
import { parsePageParam } from "@/lib/utils/pagination";

const PAGE_SIZE = 8;

function isYear(value: string) {
  return /^\d{4}$/.test(value);
}

export default function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearParam } = use(params);
  const year = decodeURIComponent(yearParam);
  const valid = isYear(year);
  const t = useTranslations("Journal");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get("page"));
  const facets = useRetrieveFacetsQuery();
  const months = (facets.data?.archives ?? [])
    .filter(
      (facet) =>
        facet.year === Number(year) && typeof facet.month === "number" && (facet.count ?? 0) > 0
    )
    .sort((left, right) => (right.month ?? 0) - (left.month ?? 0));
  const archive = useRetrieveArchiveQuery(
    {
      pageable: { page: page - 1, size: PAGE_SIZE, sort: ["publishedAt,desc"] },
      year: Number(year),
    },
    { skip: !valid }
  );
  const posts = archive.data?.list ?? [];
  const total = archive.data?.total ?? 0;
  const totalPages = archive.data?.totalPages ?? 0;
  useNormalizePageParam(
    page,
    archive.currentData ? (archive.currentData.totalPages ?? 0) : undefined
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex max-w-2xl flex-col gap-2">
        <Link className="text-sm no-underline" href="/single">
          {t("title")}
        </Link>
        <Typography type="h1" weight="semibold">
          {year}
        </Typography>
        {archive.data ? (
          <span className="text-muted text-sm tabular-nums">
            <NumberValue locale={locale} value={total}>
              {(formatted) => t("yearEssays", { count: formatted, year })}
            </NumberValue>
          </span>
        ) : null}
      </header>

      {months.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {months.map((facet) => (
            <li key={facet.month}>
              <Card>
                <Card.Header>
                  <Card.Title>
                    <Link
                      className="text-foreground no-underline"
                      href={`/single/years/${year}/${facet.month}`}
                    >
                      {new Intl.DateTimeFormat(locale, { month: "long" }).format(
                        new Date(Date.UTC(Number(year), (facet.month ?? 1) - 1, 1))
                      )}
                    </Link>
                  </Card.Title>
                  <Card.Description>
                    <NumberValue locale={locale} value={facet.count ?? 0}>
                      {(formatted) => t("monthEssays", { count: formatted })}
                    </NumberValue>
                  </Card.Description>
                </Card.Header>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      {valid && archive.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : valid && archive.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("latestFailed")}</EmptyState.Title>
            <EmptyState.Description>{t("latestFailedHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button size="sm" variant="secondary" onPress={() => void archive.refetch()}>
              {t("tryAgain")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : !valid || posts.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("yearMissing")}</EmptyState.Title>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link href="/single">{t("title")}</Link>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <>
          <EssayGrid posts={posts} />
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
    </div>
  );
}

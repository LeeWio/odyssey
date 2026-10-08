"use client";

import { createPageReveal } from "@/lib/motion";

import { Icon } from "@iconify/react";

import { EmptyState } from "@heroui-pro/react";
import {
  Button,
  Chip,
  Label,
  ListBox,
  Pagination,
  Select,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

import { useRetrieveArchiveQuery, useRetrieveFacetsQuery } from "@/lib/features/openapi";
import { PageContainer } from "@/components/layout/page-container";

const PAGE_SIZE = 10;

type ArchiveFacet = {
  year: number;
  month: number;
  count: number;
};

type ArchivePost = {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  categoryName?: string;
  views: number;
  publishedAt?: string;
};

function parseYear(value: string | null) {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1000 && parsed <= 9999 ? parsed : undefined;
}

function parseMonth(value: string | null) {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : undefined;
}

function parsePositiveInteger(value: string | null) {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function formatMonth(value: number, locale: string, format: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(locale, { month: format, timeZone: "UTC" }).format(
    new Date(Date.UTC(2026, value - 1, 1))
  );
}

function formatDate(value: string | undefined, locale: string, fallback: string) {
  if (!value) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getPageNumbers(page: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const current = page + 1;
  const values: Array<number | "ellipsis-start" | "ellipsis-end"> = [1];

  if (current > 3) values.push("ellipsis-start");
  for (
    let value = Math.max(2, current - 1);
    value <= Math.min(totalPages - 1, current + 1);
    value++
  ) {
    values.push(value);
  }
  if (current < totalPages - 2) values.push("ellipsis-end");
  values.push(totalPages);

  return values;
}

function normalizeFacets(
  values: Array<{ year?: number; month?: number; count?: number }> | undefined
): ArchiveFacet[] {
  return (values ?? []).flatMap((value) => {
    const { count, month, year } = value;

    if (
      typeof year !== "number" ||
      typeof month !== "number" ||
      typeof count !== "number" ||
      !Number.isSafeInteger(year) ||
      !Number.isSafeInteger(month) ||
      !Number.isSafeInteger(count) ||
      !year ||
      !month ||
      month < 1 ||
      month > 12 ||
      count < 0
    ) {
      return [];
    }

    return [{ year, month, count }];
  });
}

function normalizePosts(
  values:
    | Array<{
        id?: number;
        title?: string;
        slug?: string;
        summary?: string;
        category?: { name?: string };
        views?: number;
        publishedAt?: string;
      }>
    | undefined
): ArchivePost[] {
  return (values ?? []).flatMap((value) => {
    if (typeof value.id !== "number" || !value.title || !value.slug) return [];

    return [
      {
        id: value.id,
        title: value.title,
        slug: value.slug,
        summary: value.summary || undefined,
        categoryName: value.category?.name || undefined,
        views: value.views ?? 0,
        publishedAt: value.publishedAt || undefined,
      },
    ];
  });
}

function ArchiveSkeleton() {
  const t = useTranslations("Archive");
  return (
    <div
      aria-busy="true"
      aria-label={t("loading")}
      className="divide-default-200 divide-y"
      role="status"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid gap-4 py-6 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-7">
          <div className="hidden pt-1 sm:block">
            <Skeleton className="h-4 w-12 rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ArchivePostItem({ post }: { post: ArchivePost }) {
  const t = useTranslations("Archive");
  const locale = useLocale();
  return (
    <article className="group grid min-w-0 gap-4 py-7 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[9rem_minmax(0,1fr)_auto]">
      <time
        className="text-muted hidden pt-1 font-mono text-sm tabular-nums sm:block"
        dateTime={post.publishedAt}
      >
        {formatDate(post.publishedAt, locale, t("recently"))}
      </time>
      <Link className="block min-w-0 no-underline" href={`/single/${post.slug}`} prefetch={false}>
        <div className="flex flex-wrap items-center gap-2">
          {post.categoryName ? (
            <Chip size="sm" variant="soft">
              {post.categoryName}
            </Chip>
          ) : null}
          <time className="text-muted font-mono text-xs sm:hidden" dateTime={post.publishedAt}>
            {formatDate(post.publishedAt, locale, t("recently"))}
          </time>
        </div>
        <Typography
          type="h3"
          weight="semibold"
          className="group-hover:text-accent mt-3 tracking-normal wrap-anywhere transition-colors"
        >
          {post.title}
        </Typography>
        {post.summary ? (
          <Typography
            color="muted"
            type="body-sm"
            className="mt-2 line-clamp-2 max-w-3xl leading-6"
          >
            {post.summary}
          </Typography>
        ) : null}
      </Link>
      <Typography
        color="muted"
        type="body-xs"
        className="flex items-center gap-1.5 tabular-nums lg:justify-self-end lg:pt-1"
      >
        <Icon icon="gravity-ui:eye" aria-hidden="true" className="size-3.5" />
        {t("views", { count: post.views.toLocaleString(locale) })}
      </Typography>
    </article>
  );
}

export function ArchivePage() {
  const t = useTranslations("Archive");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const selectedYear = parseYear(searchParams.get("year"));
  const selectedMonth = selectedYear ? parseMonth(searchParams.get("month")) : undefined;
  const page = Math.max(0, (parsePositiveInteger(searchParams.get("page")) ?? 1) - 1);
  const facetsQuery = useRetrieveFacetsQuery();
  const archiveQuery = useRetrieveArchiveQuery({
    year: selectedYear,
    month: selectedMonth,
    pageable: { page, size: PAGE_SIZE, sort: ["publishedAt,desc"] },
  });

  const archiveFacets = normalizeFacets(facetsQuery.data?.archives).filter(
    (facet) => facet.count > 0
  );
  const years = [...new Set(archiveFacets.map((facet) => facet.year))].sort(
    (left, right) => right - left
  );
  const months = archiveFacets
    .filter((facet) => facet.year === selectedYear)
    .sort((left, right) => right.month - left.month);
  const currentPage = archiveQuery.currentData;
  const lastPage = Math.max(0, (currentPage?.totalPages ?? 1) - 1);
  const isAdjustingPage =
    archiveQuery.isSuccess &&
    !archiveQuery.isFetching &&
    currentPage?.totalPages !== undefined &&
    page > lastPage;
  const isLoadingPage =
    isAdjustingPage || archiveQuery.isLoading || (archiveQuery.isFetching && !currentPage);

  // Correct obsolete bookmarked pages only after a successful response for this period.
  useEffect(() => {
    if (!isAdjustingPage) return;
    const next = new URLSearchParams(searchParams.toString());
    if (lastPage === 0) next.delete("page");
    else next.set("page", String(lastPage + 1));
    const query = next.toString();
    router.replace(query ? `/archive?${query}` : "/archive", { scroll: false });
  }, [isAdjustingPage, lastPage, router, searchParams]);

  const posts = normalizePosts(currentPage?.list);
  const total = currentPage?.total ?? 0;
  const totalPages = currentPage?.totalPages ?? 0;
  const resultSize = currentPage?.size ?? PAGE_SIZE;
  const startItem = currentPage && total > 0 ? page * resultSize + 1 : 0;
  const endItem = currentPage ? Math.min((page + 1) * resultSize, total) : 0;
  const updateSearch = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());

    Object.entries(changes).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });

    const serialized = next.toString();
    router.replace(serialized ? `/archive?${serialized}` : "/archive", { scroll: false });
  };

  const handleYearChange = (value: React.Key | null) => {
    const year = value === "all" || !value ? undefined : String(value);
    updateSearch({ month: undefined, page: undefined, year });
  };

  const handleMonthChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    const month = key == null || key === "all" ? undefined : String(key).replace("month-", "");
    updateSearch({ month, page: undefined });
  };

  const handlePageChange = (nextPage: number) => {
    updateSearch({ page: String(nextPage + 1) });
    document
      .getElementById("archive-results")
      ?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
  };

  const clearPeriod = () => updateSearch({ month: undefined, page: undefined, year: undefined });

  const periodTitle = selectedYear
    ? selectedMonth
      ? `${formatMonth(selectedMonth, locale)} ${selectedYear}`
      : String(selectedYear)
    : t("allWriting");
  const periodDescription = selectedYear
    ? selectedMonth
      ? t("periodMonth", { month: formatMonth(selectedMonth, locale), year: selectedYear })
      : t("periodYear", { year: selectedYear })
    : t("fullNotebook");

  const { revealInView } = createPageReveal(shouldReduceMotion);

  return (
    <div className="bg-background min-h-dvh w-full pt-28 pb-24 lg:pt-32">
      <PageContainer>
        <header className="border-separator flex min-w-0 flex-col gap-8 border-b pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <motion.div {...revealInView(0, 10)}>
              <Chip color="default" size="sm" variant="secondary">
                {t("eyebrow")}
              </Chip>
            </motion.div>
            <motion.div {...revealInView(0.06)}>
              <Typography
                type="h1"
                weight="bold"
                className="mt-4 text-4xl leading-none tracking-normal text-balance wrap-anywhere sm:text-5xl lg:text-6xl"
              >
                {t("title")}
              </Typography>
            </motion.div>
            <motion.div {...revealInView(0.12, 14)}>
              <Typography color="muted" type="body" className="mt-4 max-w-2xl text-pretty">
                {t("description")}
              </Typography>
            </motion.div>
          </div>
          <div className="flex shrink-0 items-center gap-3 lg:pb-1">
            <Icon icon="gravity-ui:calendar" aria-hidden="true" className="text-muted size-5" />
            <div>
              <Typography type="body-sm" weight="semibold">
                {years.length.toLocaleString(locale)}
              </Typography>
              <Typography color="muted" type="body-xs">
                {t("year")}
              </Typography>
            </div>
          </div>
        </header>

        <motion.section
          aria-label={t("periodSelector")}
          className="border-separator mt-10 border-b pb-8"
          {...revealInView(0.18, 16)}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-end lg:gap-10">
            <Select
              fullWidth
              placeholder={t("allYears")}
              value={selectedYear ? String(selectedYear) : "all"}
              variant="secondary"
              onChange={handleYearChange}
            >
              <Label>{t("year")}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue={t("allYears")}>
                    {t("allYears")}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {years.map((year) => (
                    <ListBox.Item key={year} id={String(year)} textValue={String(year)}>
                      {year}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <Icon icon="gravity-ui:calendar" aria-hidden="true" className="text-muted size-4" />
                <Typography type="body-sm" weight="semibold">
                  {selectedYear ? t("month") : t("chooseYear")}
                </Typography>
              </div>
              {facetsQuery.isLoading ? (
                <div className="flex gap-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              ) : selectedYear && months.length > 0 ? (
                <TagGroup
                  aria-label={t("filterYear", { year: selectedYear })}
                  selectedKeys={new Set([selectedMonth ? `month-${selectedMonth}` : "all"])}
                  selectionMode="single"
                  size="sm"
                  variant="surface"
                  onSelectionChange={handleMonthChange}
                >
                  <TagGroup.List className="flex-wrap">
                    <Tag id="all" textValue={t("allOfYear", { year: selectedYear })}>
                      {t("allOfYear", { year: selectedYear })}
                    </Tag>
                    {months.map((facet) => (
                      <Tag
                        key={facet.month}
                        id={`month-${facet.month}`}
                        textValue={formatMonth(facet.month, locale)}
                      >
                        {formatMonth(facet.month, locale, "short")}
                        <span className="text-muted text-xs tabular-nums">{facet.count}</span>
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              ) : selectedYear ? (
                <Typography color="muted" type="body-sm">
                  {t("noMonths")}
                </Typography>
              ) : (
                <Typography color="muted" type="body-sm">
                  {t("timelineHint")}
                </Typography>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="archive-results"
          aria-busy={archiveQuery.isFetching || isAdjustingPage}
          aria-labelledby="archive-results-title"
          className="scroll-mt-28 pt-14"
          {...revealInView(0.22, 20)}
        >
          <div className="border-separator mb-2 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Typography
                id="archive-results-title"
                type="h2"
                weight="semibold"
                className="tracking-normal"
              >
                {periodTitle}
              </Typography>
              <Typography aria-live="polite" color="muted" type="body-sm" className="mt-1">
                {currentPage && !isAdjustingPage
                  ? t("articlesFound", { count: total.toLocaleString(locale) })
                  : periodDescription}
              </Typography>
            </div>
            {selectedYear ? (
              <Button size="sm" variant="ghost" onPress={clearPeriod}>
                {t("viewAllYears")}
              </Button>
            ) : null}
          </div>

          {isLoadingPage ? <ArchiveSkeleton /> : null}

          {!isLoadingPage && archiveQuery.isError ? (
            <EmptyState size="lg">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <Icon icon="gravity-ui:book-open" aria-hidden="true" />
                </EmptyState.Media>
                <EmptyState.Title>{t("unavailable")}</EmptyState.Title>
                <EmptyState.Description>{t("unavailableHint")}</EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button variant="outline" onPress={() => archiveQuery.refetch()}>
                  <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
                  {t("tryAgain")}
                </Button>
              </EmptyState.Content>
            </EmptyState>
          ) : null}

          {!isLoadingPage && !archiveQuery.isError && posts.length === 0 ? (
            <EmptyState size="lg">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <Icon icon="gravity-ui:calendar" aria-hidden="true" />
                </EmptyState.Media>
                <EmptyState.Title>{t("emptyTitle")}</EmptyState.Title>
                <EmptyState.Description>{t("emptyHint")}</EmptyState.Description>
              </EmptyState.Header>
              {selectedYear ? (
                <EmptyState.Content>
                  <Button variant="outline" onPress={clearPeriod}>
                    {t("viewAllYears")}
                  </Button>
                </EmptyState.Content>
              ) : null}
            </EmptyState>
          ) : null}

          {!isLoadingPage && !archiveQuery.isError && posts.length > 0 ? (
            <div className="divide-separator divide-y border-y" data-testid="archive-results-list">
              {posts.map((post) => (
                <ArchivePostItem key={post.id} post={post} />
              ))}
            </div>
          ) : null}

          {!isAdjustingPage && (page > 0 || totalPages > 1) ? (
            <Pagination className="mt-12 w-full" size="sm">
              <Pagination.Summary>
                {currentPage
                  ? t("showing", { start: startItem, end: endItem, total })
                  : t("pageNumber", { page: page + 1 })}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 0 || archiveQuery.isFetching}
                    onPress={() => handlePageChange(page - 1)}
                  >
                    <Pagination.PreviousIcon />
                    <span>{t("previous")}</span>
                  </Pagination.Previous>
                </Pagination.Item>
                {getPageNumbers(page, totalPages).map((value) =>
                  typeof value === "number" ? (
                    <Pagination.Item key={value}>
                      <Pagination.Link
                        isActive={value === page + 1}
                        isDisabled={archiveQuery.isFetching}
                        onPress={() => handlePageChange(value - 1)}
                      >
                        {value}
                      </Pagination.Link>
                    </Pagination.Item>
                  ) : (
                    <Pagination.Item key={value}>
                      <Pagination.Ellipsis />
                    </Pagination.Item>
                  )
                )}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={archiveQuery.isFetching || !currentPage || page >= totalPages - 1}
                    onPress={() => handlePageChange(page + 1)}
                  >
                    <span>{t("next")}</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          ) : null}
        </motion.section>

        <motion.div
          className="border-default-200 mt-16 flex flex-col gap-3 border-t pt-7 sm:flex-row sm:items-center sm:justify-between"
          {...revealInView(0.26, 14)}
        >
          <Typography color="muted" type="body-sm">
            {t("lookingForIdea")}
          </Typography>
          <Link
            className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
            href="/explore"
          >
            {t("exploreWriting")}
            <Icon icon="gravity-ui:arrow-right" aria-hidden="true" className="size-4" />
          </Link>
        </motion.div>
      </PageContainer>
    </div>
  );
}

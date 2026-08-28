"use client";

import { ArrowRight, ArrowRotateLeft, BookOpen, Calendar, Eye } from "@gravity-ui/icons";
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
import { motion, useReducedMotion } from "motion/react";

import { useRetrieveArchiveQuery, useRetrieveFacetsQuery } from "@/lib/features/openapi";

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

function formatMonth(value: number, format: "long" | "short" = "long") {
  return new Intl.DateTimeFormat("en-US", { month: format, timeZone: "UTC" }).format(
    new Date(Date.UTC(2026, value - 1, 1))
  );
}

function formatDate(value?: string) {
  if (!value) return "Recently published";

  return new Intl.DateTimeFormat("en-US", {
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
  return (
    <div
      aria-busy="true"
      aria-label="Loading archived articles"
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
  return (
    <article className="group grid gap-4 py-6 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-7">
      <time
        className="text-muted hidden pt-1 font-mono text-sm sm:block"
        dateTime={post.publishedAt}
      >
        {formatDate(post.publishedAt)}
      </time>
      <Link className="block min-w-0 no-underline" href={`/single/${post.slug}`} prefetch={false}>
        <div className="flex flex-wrap items-center gap-2">
          {post.categoryName ? (
            <Chip size="sm" variant="soft">
              {post.categoryName}
            </Chip>
          ) : null}
          <time className="text-muted font-mono text-xs sm:hidden" dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <Typography
          type="h3"
          weight="semibold"
          className="group-hover:text-accent mt-3 transition-colors"
        >
          {post.title}
        </Typography>
        {post.summary ? (
          <Typography color="muted" type="body-sm" className="mt-2 line-clamp-2 max-w-3xl">
            {post.summary}
          </Typography>
        ) : null}
        <Typography
          color="muted"
          type="body-xs"
          className="mt-4 flex items-center gap-1.5 tabular-nums"
        >
          <Eye aria-hidden="true" className="size-3.5" />
          {post.views.toLocaleString("en-US")} views
        </Typography>
      </Link>
    </article>
  );
}

export function ArchivePage() {
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
  const posts = normalizePosts(archiveQuery.data?.list);
  const total = archiveQuery.data?.total ?? 0;
  const totalPages = archiveQuery.data?.totalPages ?? 0;
  const resultSize = archiveQuery.data?.size ?? PAGE_SIZE;
  const startItem = archiveQuery.data && total > 0 ? page * resultSize + 1 : 0;
  const endItem = archiveQuery.data ? Math.min((page + 1) * resultSize, total) : 0;
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
    const month = String(key) === "all" ? undefined : String(key).replace("month-", "");
    updateSearch({ month, page: undefined });
  };

  const handlePageChange = (nextPage: number) => {
    updateSearch({ page: String(nextPage + 1) });
    document
      .getElementById("archive-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearPeriod = () => updateSearch({ month: undefined, page: undefined, year: undefined });

  const periodTitle = selectedYear
    ? selectedMonth
      ? `${formatMonth(selectedMonth)} ${selectedYear}`
      : String(selectedYear)
    : "All writing";
  const periodDescription = selectedYear
    ? selectedMonth
      ? `Every article published in ${formatMonth(selectedMonth)} ${selectedYear}.`
      : `Every article published in ${selectedYear}.`
    : "A chronological view of the full notebook.";

  const revealInView = (delay = 0, distance = 20) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.65,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex flex-col items-center text-center">
        <motion.div {...revealInView(0, 10)}>
          <Chip color="default" size="sm" variant="secondary">
            Archive
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.05em] text-balance"
          >
            Read the work in sequence.
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className="mt-3 max-w-xl text-balance">
            Return to a month, follow the years, and find the writing that belongs to a particular
            moment.
          </Typography>
        </motion.div>
      </header>

      <motion.section
        aria-label="Archive period selector"
        className="border-default-200 mt-12 border-y py-7"
        {...revealInView(0.18, 16)}
      >
        <div className="grid gap-7 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
          <Select
            fullWidth
            placeholder="All years"
            value={selectedYear ? String(selectedYear) : "all"}
            variant="secondary"
            onChange={handleYearChange}
          >
            <Label>Year</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="All years">
                  All years
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
              <Calendar aria-hidden="true" className="text-muted size-4" />
              <Typography type="body-sm" weight="semibold">
                {selectedYear ? "Month" : "Choose a year to narrow to a month"}
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
                aria-label={`Filter ${selectedYear} by month`}
                selectedKeys={new Set([selectedMonth ? `month-${selectedMonth}` : "all"])}
                selectionMode="single"
                size="sm"
                variant="surface"
                onSelectionChange={handleMonthChange}
              >
                <TagGroup.List className="flex-wrap">
                  <Tag id="all" textValue={`All of ${selectedYear}`}>
                    All of {selectedYear}
                  </Tag>
                  {months.map((facet) => (
                    <Tag
                      key={facet.month}
                      id={`month-${facet.month}`}
                      textValue={formatMonth(facet.month)}
                    >
                      {formatMonth(facet.month, "short")}
                      <span className="text-muted text-xs tabular-nums">{facet.count}</span>
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            ) : selectedYear ? (
              <Typography color="muted" type="body-sm">
                No published months are recorded for this year.
              </Typography>
            ) : (
              <Typography color="muted" type="body-sm">
                The complete timeline remains visible until you choose a year.
              </Typography>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="archive-results"
        aria-busy={archiveQuery.isFetching}
        aria-labelledby="archive-results-title"
        className="scroll-mt-28 pt-14"
        {...revealInView(0.22, 20)}
      >
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Typography id="archive-results-title" type="h2" weight="semibold">
              {periodTitle}
            </Typography>
            <Typography aria-live="polite" color="muted" type="body-sm" className="mt-1">
              {archiveQuery.data
                ? `${total.toLocaleString("en-US")} articles found`
                : periodDescription}
            </Typography>
          </div>
          {selectedYear ? (
            <Button size="sm" variant="ghost" onPress={clearPeriod}>
              View all years
            </Button>
          ) : null}
        </div>

        {archiveQuery.isLoading ? <ArchiveSkeleton /> : null}

        {!archiveQuery.isLoading && archiveQuery.isError ? (
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <BookOpen aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>The archive is unavailable</EmptyState.Title>
              <EmptyState.Description>
                The selected period could not be loaded. Please try again in a moment.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button variant="outline" onPress={() => archiveQuery.refetch()}>
                <ArrowRotateLeft aria-hidden="true" />
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : null}

        {!archiveQuery.isLoading && !archiveQuery.isError && posts.length === 0 ? (
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Calendar aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>No writing from this period</EmptyState.Title>
              <EmptyState.Description>
                Try another month, choose a different year, or return to the full timeline.
              </EmptyState.Description>
            </EmptyState.Header>
            {selectedYear ? (
              <EmptyState.Content>
                <Button variant="outline" onPress={clearPeriod}>
                  View all years
                </Button>
              </EmptyState.Content>
            ) : null}
          </EmptyState>
        ) : null}

        {!archiveQuery.isLoading && !archiveQuery.isError && posts.length > 0 ? (
          <div className="divide-default-200 divide-y border-y">
            {posts.map((post) => (
              <ArchivePostItem key={post.id} post={post} />
            ))}
          </div>
        ) : null}

        {!archiveQuery.isLoading && !archiveQuery.isError && totalPages > 1 ? (
          <Pagination className="mt-12 w-full" size="sm">
            <Pagination.Summary>
              Showing {startItem}-{endItem} of {total}
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={page === 0}
                  onPress={() => handlePageChange(page - 1)}
                >
                  <Pagination.PreviousIcon />
                  <span>Previous</span>
                </Pagination.Previous>
              </Pagination.Item>
              {getPageNumbers(page, totalPages).map((value) =>
                typeof value === "number" ? (
                  <Pagination.Item key={value}>
                    <Pagination.Link
                      isActive={value === page + 1}
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
                  isDisabled={page >= totalPages - 1}
                  onPress={() => handlePageChange(page + 1)}
                >
                  <span>Next</span>
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
          Looking for an idea rather than a date? Search by subject and recurring tag.
        </Typography>
        <Link
          className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
          href="/explore"
        >
          Explore writing
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </motion.div>
    </main>
  );
}

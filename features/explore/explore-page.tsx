"use client";

import {
  ArrowRight,
  ArrowRotateLeft,
  BookOpen,
  Calendar,
  Eye,
  Hashtag,
  Layers,
  Xmark,
} from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import {
  Button,
  Card,
  Chip,
  Label,
  Pagination,
  SearchField,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import type { PostResponse } from "@/features/blog";
import { useGetPublicPostsQuery } from "@/features/blog";
import { useRetrieveFacetsQuery } from "@/lib/features/openapi";

const PAGE_SIZE = 9;

type Facet = {
  id: number;
  name: string;
  count: number;
};

function parsePositiveInteger(value: string | null) {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function formatDate(value: string) {
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
  values: Array<{ id?: number; name?: string; count?: number }> | undefined
): Facet[] {
  return (values ?? []).flatMap((value) => {
    if (typeof value.id !== "number" || !value.name || typeof value.count !== "number") return [];
    return [{ id: value.id, name: value.name, count: value.count }];
  });
}

function ExplorePostCard({ post }: { post: PostResponse }) {
  return (
    <Link className="group block h-full no-underline" href={`/single/${post.slug}`}>
      <Card
        variant="secondary"
        className="h-full overflow-hidden p-0 transition-transform duration-200 group-hover:-translate-y-1"
      >
        <SmartColorSurface
          seed={`explore-${post.slug}`}
          tone={getSmartColorTone({ categoryName: post.category?.name, title: post.title })}
        >
          <div aria-hidden="true" className="aspect-[16/9] w-full" />
        </SmartColorSurface>
        <Card.Header className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {post.category?.name ? (
              <Chip size="sm" variant="soft">
                {post.category.name}
              </Chip>
            ) : null}
            {(post.tags ?? []).slice(0, 2).map((tag) => (
              <span key={tag.id} className="text-muted text-xs">
                #{tag.name}
              </span>
            ))}
          </div>
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto justify-between gap-3">
          <Typography color="muted" type="body-xs">
            {formatDate(post.createdAt)}
          </Typography>
          <Typography
            color="muted"
            type="body-xs"
            className="flex shrink-0 items-center gap-1.5 tabular-nums"
          >
            <Eye aria-hidden="true" className="size-3.5" />
            {post.views.toLocaleString("en-US")}
          </Typography>
        </Card.Footer>
      </Card>
    </Link>
  );
}

function ExploreSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading articles"
      className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      role="status"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} variant="secondary" className="overflow-hidden p-0">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <Card.Header className="gap-3">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-6 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </Card.Header>
        </Card>
      ))}
    </div>
  );
}

function ExploreSearchField({
  initialQuery,
  onQueryChange,
}: {
  initialQuery: string;
  onQueryChange: (query: string) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const updateUrl = useDebouncedCallback(onQueryChange, 300);

  useEffect(() => () => updateUrl.cancel(), [updateUrl]);

  return (
    <SearchField
      fullWidth
      className="max-w-xl"
      name="explore-search"
      value={query}
      onChange={(value) => {
        setQuery(value);
        updateUrl(value.trim());
      }}
    >
      <Label className="sr-only">Search the archive</Label>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search titles and summaries" />
        <SearchField.ClearButton aria-label="Clear search" />
      </SearchField.Group>
    </SearchField>
  );
}

export function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategoryId = parsePositiveInteger(searchParams.get("category"));
  const selectedTagId = parsePositiveInteger(searchParams.get("tag"));
  const page = Math.max(0, (parsePositiveInteger(searchParams.get("page")) ?? 1) - 1);
  const queryFromUrl = searchParams.get("q") ?? "";
  const normalizedQuery = queryFromUrl.trim();
  const facetsQuery = useRetrieveFacetsQuery();
  const postsQuery = useGetPublicPostsQuery({
    categoryId: selectedCategoryId,
    keyword: normalizedQuery || undefined,
    page,
    size: PAGE_SIZE,
    tagId: selectedTagId,
  });

  const categories = useMemo(
    () => normalizeFacets(facetsQuery.data?.categories).filter((facet) => facet.count > 0),
    [facetsQuery.data?.categories]
  );
  const tags = useMemo(
    () => normalizeFacets(facetsQuery.data?.tags).filter((facet) => facet.count > 0),
    [facetsQuery.data?.tags]
  );
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const selectedTag = tags.find((tag) => tag.id === selectedTagId);
  const posts = postsQuery.data?.list ?? [];
  const totalPages = postsQuery.data?.totalPages ?? 0;
  const startItem =
    postsQuery.data && postsQuery.data.total > 0 ? page * postsQuery.data.size + 1 : 0;
  const endItem = postsQuery.data
    ? Math.min((page + 1) * postsQuery.data.size, postsQuery.data.total)
    : 0;
  const hasActiveFilters = Boolean(selectedCategoryId || selectedTagId || normalizedQuery);

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
    router.replace(serialized ? `/explore?${serialized}` : "/explore", { scroll: false });
  };

  const handleCategoryChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    const categoryId = String(key) === "all" ? undefined : String(key).replace("category-", "");
    updateSearch({ category: categoryId, page: undefined });
  };

  const handleTagChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    const tagId = String(key) === "all" ? undefined : String(key).replace("tag-", "");
    updateSearch({ page: undefined, tag: tagId });
  };

  const handlePageChange = (nextPage: number) => {
    updateSearch({ page: String(nextPage + 1) });
    document
      .getElementById("explore-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    updateSearch({ category: undefined, page: undefined, q: undefined, tag: undefined });
  };

  const resultsTitle = normalizedQuery
    ? `Results for “${normalizedQuery}”`
    : selectedCategory?.name || selectedTag?.name || "All writing";

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
          <div className="max-w-3xl">
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <Layers aria-hidden="true" className="size-4" />
              Explore the archive
            </div>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              Find the thread to follow.
            </Typography>
            <Typography color="muted" type="body" className="mt-5 max-w-xl">
              Browse writing by subject, follow the tags that recur, or search for the question you
              have in mind.
            </Typography>
          </div>
          <div className="border-default-200 border-l pl-5 sm:pl-6">
            <Typography className="font-mono text-3xl tabular-nums" type="body">
              {(facetsQuery.data?.totalPublishedCount ?? 0).toLocaleString("en-US")}
            </Typography>
            <Typography color="muted" type="body-sm" className="mt-1">
              published pieces to explore
            </Typography>
          </div>
        </header>

        <section aria-label="Explore filters" className="border-default-200 mt-14 border-y py-7">
          <ExploreSearchField
            key={queryFromUrl}
            initialQuery={queryFromUrl}
            onQueryChange={(query) => updateSearch({ page: undefined, q: query || undefined })}
          />

          <div className="mt-7 grid gap-7">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen aria-hidden="true" className="text-muted size-4" />
                <Typography type="body-sm" weight="semibold">
                  Topics
                </Typography>
              </div>
              {facetsQuery.isLoading ? (
                <div className="flex gap-2">
                  {["w-20", "w-28", "w-24", "w-32"].map((width) => (
                    <Skeleton key={width} className={`h-8 ${width} rounded-full`} />
                  ))}
                </div>
              ) : categories.length > 0 ? (
                <TagGroup
                  aria-label="Filter writing by topic"
                  selectedKeys={
                    new Set([selectedCategoryId ? `category-${selectedCategoryId}` : "all"])
                  }
                  selectionMode="single"
                  size="sm"
                  variant="surface"
                  onSelectionChange={handleCategoryChange}
                >
                  <TagGroup.List className="flex-wrap">
                    <Tag id="all" textValue="All topics">
                      All topics
                      <span className="text-muted text-xs tabular-nums">
                        {facetsQuery.data?.totalPublishedCount ?? 0}
                      </span>
                    </Tag>
                    {categories.map((category) => (
                      <Tag
                        key={category.id}
                        id={`category-${category.id}`}
                        textValue={category.name}
                      >
                        {category.name}
                        <span className="text-muted text-xs tabular-nums">{category.count}</span>
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              ) : facetsQuery.isError ? (
                <Button size="sm" variant="secondary" onPress={() => facetsQuery.refetch()}>
                  <ArrowRotateLeft aria-hidden="true" className="size-4" />
                  Reload topics
                </Button>
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <Hashtag aria-hidden="true" className="text-muted size-4" />
                <Typography type="body-sm" weight="semibold">
                  Tags
                </Typography>
              </div>
              {facetsQuery.isLoading ? (
                <div className="flex gap-2">
                  {["w-16", "w-24", "w-20", "w-28", "w-20"].map((width, index) => (
                    <Skeleton key={`${width}-${index}`} className={`h-8 ${width} rounded-full`} />
                  ))}
                </div>
              ) : tags.length > 0 ? (
                <TagGroup
                  aria-label="Filter writing by tag"
                  selectedKeys={new Set([selectedTagId ? `tag-${selectedTagId}` : "all"])}
                  selectionMode="single"
                  size="sm"
                  variant="surface"
                  onSelectionChange={handleTagChange}
                >
                  <TagGroup.List className="flex-wrap">
                    <Tag id="all" textValue="All tags">
                      All tags
                    </Tag>
                    {tags.map((tag) => (
                      <Tag key={tag.id} id={`tag-${tag.id}`} textValue={tag.name}>
                        #{tag.name}
                        <span className="text-muted text-xs tabular-nums">{tag.count}</span>
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              ) : null}
            </div>

            <div className="border-default-200 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted flex items-center gap-2 text-sm">
                <Calendar aria-hidden="true" className="size-4" />
                Prefer to browse the notebook by when it was published?
              </div>
              <Link
                className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
                href="/archive"
              >
                Browse by date
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section
          id="explore-results"
          aria-busy={postsQuery.isFetching}
          aria-labelledby="explore-results-title"
          className="scroll-mt-28 pt-14"
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Typography id="explore-results-title" type="h2" weight="semibold">
                {resultsTitle}
              </Typography>
              <Typography aria-live="polite" color="muted" type="body-sm" className="mt-1">
                {postsQuery.data
                  ? `${postsQuery.data.total.toLocaleString("en-US")} articles found`
                  : "Searching the archive"}
              </Typography>
            </div>
            {hasActiveFilters ? (
              <Button size="sm" variant="ghost" onPress={clearFilters}>
                <Xmark aria-hidden="true" className="size-4" />
                Clear filters
              </Button>
            ) : null}
          </div>

          {postsQuery.isLoading ? <ExploreSkeleton /> : null}

          {!postsQuery.isLoading && postsQuery.isError ? (
            <EmptyState size="lg">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <BookOpen aria-hidden="true" />
                </EmptyState.Media>
                <EmptyState.Title>The archive is unavailable</EmptyState.Title>
                <EmptyState.Description>
                  The selected writing could not be loaded. Please try again in a moment.
                </EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button variant="outline" onPress={() => postsQuery.refetch()}>
                  <ArrowRotateLeft aria-hidden="true" />
                  Try again
                </Button>
              </EmptyState.Content>
            </EmptyState>
          ) : null}

          {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 ? (
            <EmptyState size="lg">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <BookOpen aria-hidden="true" />
                </EmptyState.Media>
                <EmptyState.Title>No writing matches these filters</EmptyState.Title>
                <EmptyState.Description>
                  Try another phrase or widen the topics and tags you are browsing.
                </EmptyState.Description>
              </EmptyState.Header>
              {hasActiveFilters ? (
                <EmptyState.Content>
                  <Button variant="outline" onPress={clearFilters}>
                    Clear filters
                  </Button>
                </EmptyState.Content>
              ) : null}
            </EmptyState>
          ) : null}

          {!postsQuery.isLoading && !postsQuery.isError && posts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <ExplorePostCard key={post.id} post={post} />
              ))}
            </div>
          ) : null}

          {!postsQuery.isLoading && !postsQuery.isError && totalPages > 1 ? (
            <Pagination className="mt-12 w-full" size="sm">
              <Pagination.Summary>
                Showing {startItem}-{endItem} of {postsQuery.data?.total ?? 0}
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
        </section>

        <div className="border-default-200 mt-16 flex flex-col gap-3 border-t pt-7 sm:flex-row sm:items-center sm:justify-between">
          <Typography color="muted" type="body-sm">
            Prefer a guided sequence? Follow a column from beginning to end.
          </Typography>
          <Link
            className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
            href="/columns"
          >
            Browse columns
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

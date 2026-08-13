"use client";

import { ArrowRotateRight, BookOpen } from "@gravity-ui/icons";
import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  SearchField,
  Select,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
} from "@heroui/react";
import { useDeferredValue, useMemo, useState } from "react";
import { useGetPublicColumnsQuery } from "@/lib/features/column";
import { ColumnCard } from "./column-card";

type AvailabilityFilter = "all" | "ready" | "starting";
type ColumnSort = "newest" | "most-essays" | "alphabetical";

function getCreatedAtTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function ColumnsIndex() {
  const { data: columns = [], error, isLoading, refetch } = useGetPublicColumnsQuery();
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<ColumnSort>("newest");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const visibleColumns = useMemo(() => {
    const filtered = columns.filter((column) => {
      const matchesSearch =
        !deferredSearch ||
        [column.name, column.slug, column.description ?? ""].some((value) =>
          value.toLocaleLowerCase().includes(deferredSearch)
        );
      const matchesAvailability =
        availability === "all" ||
        (availability === "ready" ? column.postsCount > 0 : column.postsCount === 0);

      return matchesSearch && matchesAvailability;
    });

    return [...filtered].sort((first, second) => {
      if (sort === "most-essays") return second.postsCount - first.postsCount;
      if (sort === "alphabetical") return first.name.localeCompare(second.name);

      return getCreatedAtTime(second.createdAt) - getCreatedAtTime(first.createdAt);
    });
  }, [availability, columns, deferredSearch, sort]);

  const clearFilters = () => {
    setSearch("");
    setAvailability("all");
  };

  const handleAvailabilityChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    if (key === "all" || key === "ready" || key === "starting") {
      setAvailability(key);
    }
  };

  return (
    <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
          <div className="max-w-3xl">
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <BookOpen aria-hidden="true" className="size-4" />
              Columns
            </div>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              Follow an idea beyond one essay.
            </Typography>
            <Typography color="muted" type="body" className="mt-5 max-w-xl">
              Focused reading paths collecting the work, context, and questions that belong
              together.
            </Typography>
          </div>
          <div className="border-default-200 border-l pl-5 sm:pl-6">
            <Typography className="font-mono text-3xl tabular-nums" type="body">
              {columns.length.toLocaleString("en-US")}
            </Typography>
            <Typography color="muted" type="body-sm" className="mt-1">
              published reading paths
            </Typography>
          </div>
        </header>

        <section aria-label="Published columns" className="mt-14">
          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Card key={index} variant="secondary" className="overflow-hidden p-0">
                  <Skeleton className="aspect-[16/9] w-full rounded-none" />
                  <Card.Header>
                    <Skeleton className="h-5 w-20 rounded-lg" />
                    <Skeleton className="h-7 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                  </Card.Header>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card variant="secondary" className="items-start gap-4 p-7">
              <Card.Header>
                <Card.Title>Columns are unavailable</Card.Title>
                <Card.Description>Try loading this page again in a moment.</Card.Description>
              </Card.Header>
              <Button size="sm" variant="secondary" onPress={() => refetch()}>
                <ArrowRotateRight aria-hidden="true" className="size-4" />
                Retry
              </Button>
            </Card>
          ) : columns.length === 0 ? (
            <Card variant="secondary" className="items-start gap-3 p-7">
              <Card.Header>
                <Card.Title>No columns published yet</Card.Title>
                <Card.Description>
                  New reading paths will appear here when they are ready.
                </Card.Description>
              </Card.Header>
            </Card>
          ) : (
            <>
              <div className="border-default-200 grid gap-5 border-y py-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-end">
                <div className="min-w-0">
                  <SearchField fullWidth name="column-search" value={search} onChange={setSearch}>
                    <Label className="sr-only">Search columns</Label>
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder="Search reading paths" />
                      <SearchField.ClearButton aria-label="Clear column search" />
                    </SearchField.Group>
                  </SearchField>
                  <TagGroup
                    aria-label="Filter columns by reading availability"
                    selectedKeys={new Set([availability])}
                    selectionMode="single"
                    size="sm"
                    variant="surface"
                    className="mt-4"
                    onSelectionChange={handleAvailabilityChange}
                  >
                    <TagGroup.List className="flex-wrap">
                      <Tag id="all" textValue="All columns">
                        All paths
                        <span className="text-muted text-xs tabular-nums">{columns.length}</span>
                      </Tag>
                      <Tag id="ready" textValue="Ready to read">
                        Ready to read
                        <span className="text-muted text-xs tabular-nums">
                          {columns.filter((column) => column.postsCount > 0).length}
                        </span>
                      </Tag>
                      <Tag id="starting" textValue="Starting soon">
                        Starting soon
                        <span className="text-muted text-xs tabular-nums">
                          {columns.filter((column) => column.postsCount === 0).length}
                        </span>
                      </Tag>
                    </TagGroup.List>
                  </TagGroup>
                </div>
                <Select
                  fullWidth
                  value={sort}
                  variant="secondary"
                  onChange={(value) => {
                    if (value === "newest" || value === "most-essays" || value === "alphabetical") {
                      setSort(value);
                    }
                  }}
                >
                  <Label>Sort paths</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="newest" textValue="Newest first">
                        Newest first
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="most-essays" textValue="Most essays">
                        Most essays
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="alphabetical" textValue="Alphabetical">
                        Alphabetical
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <div className="mt-7 flex items-center justify-between gap-4">
                <Typography color="muted" type="body-sm">
                  {visibleColumns.length} {visibleColumns.length === 1 ? "path" : "paths"} to
                  explore
                </Typography>
                {search || availability !== "all" ? (
                  <Button size="sm" variant="tertiary" onPress={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>

              {visibleColumns.length > 0 ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {visibleColumns.map((column) => (
                    <ColumnCard key={column.id} column={column} />
                  ))}
                </div>
              ) : (
                <Card variant="secondary" className="mt-6 items-start gap-4 p-7">
                  <Card.Header>
                    <Chip size="sm" variant="soft">
                      No matches
                    </Chip>
                    <Card.Title>No reading paths match these filters</Card.Title>
                    <Card.Description>
                      Try a different title, topic, or availability filter.
                    </Card.Description>
                  </Card.Header>
                  <Button size="sm" variant="secondary" onPress={clearFilters}>
                    Show all columns
                  </Button>
                </Card>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  Button,
  Card,
  Chip,
  InputGroup,
  Tabs,
  ScrollShadow,
  Spinner,
  Typography,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useGetPublicPostsQuery } from "@/lib/features/post/post-api";
import { useGetPublicCategoriesQuery } from "@/lib/features/category/category-api";
import { useGetPublicTagsQuery } from "@/lib/features/tag/tag-api";
import { PostCard } from "./post-card";

export function BlogFeed() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [debouncedKeyword] = useDebounce(searchVal, 400);
  const [page, setPage] = useState(0);
  const size = 9; // 9 posts per page (fits 3 cols layout)

  // Query categories & tags
  const { data: categories = [], isLoading: categoriesLoading } = useGetPublicCategoriesQuery();
  const { data: tags = [], isLoading: tagsLoading } = useGetPublicTagsQuery();

  // Selected category ID calculation
  const categoryId =
    selectedCategory === "all"
      ? undefined
      : categories.find((c) => c.slug === selectedCategory)?.id;

  // Query public posts with filters
  const {
    data: postPage,
    isLoading: postsLoading,
    isFetching: postsFetching,
    error: postsError,
  } = useGetPublicPostsQuery({
    page,
    size,
    categoryId,
    tagId: selectedTagId || undefined,
    keyword: debouncedKeyword || undefined,
  });

  const posts = postPage?.list || [];
  const totalPages = postPage?.totalPages || 1;

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    setSelectedTagId(null); // Reset tag filter on category change
    setPage(0); // Reset pagination
  };

  const handleTagToggle = (id: number) => {
    setSelectedTagId((prev) => (prev === id ? null : id));
    setPage(0);
  };

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedTagId(null);
    setSearchVal("");
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 🧭 Search and Filter Controls */}
      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <div className="relative w-full">
          <InputGroup variant="secondary" className="w-full">
            <InputGroup.Prefix>
              <Icon icon="lucide:search" className="text-default-400 size-5 shrink-0" />
            </InputGroup.Prefix>
            <InputGroup.Input
              value={searchVal}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search articles, narratives, insights..."
              aria-label="Search articles"
            />
            {searchVal && (
              <InputGroup.Suffix>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => handleSearchChange("")}
                  className="text-default-400 hover:text-foreground"
                >
                  <Icon icon="lucide:x" className="size-4" />
                </Button>
              </InputGroup.Suffix>
            )}
          </InputGroup>
        </div>

        {/* Categories Tab Bar */}
        <div className="border-default-100 w-full border-b pb-1">
          {categoriesLoading ? (
            <div className="flex h-10 items-center gap-2">
              <Spinner size="sm" color="accent" />
              <span className="text-default-400 text-xs">Loading categories...</span>
            </div>
          ) : (
            <Tabs
              selectedKey={selectedCategory}
              onSelectionChange={(key) => handleCategoryChange(key as string)}
              variant="secondary"
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label="Blog categories">
                  <Tabs.Tab id="all">
                    Explore All
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  {categories.map((cat) => (
                    <Tabs.Tab id={cat.slug} key={cat.id}>
                      {cat.name}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          )}
        </div>

        {/* Tags Row */}
        {tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <Typography
              type="body-xs"
              color="muted"
              className="font-semibold tracking-wider uppercase select-none"
            >
              Filter by Tag
            </Typography>
            <ScrollShadow
              orientation="horizontal"
              className="flex w-full items-center gap-2 py-1"
              hideScrollBar
            >
              {tags.map((tag) => {
                const isActive = selectedTagId === tag.id;
                return (
                  <Chip
                    key={tag.id}
                    size="sm"
                    variant={isActive ? "primary" : "secondary"}
                    className={cn(
                      "hover:border-accent hover:text-accent-600 cursor-pointer transition-all duration-300",
                      !isActive && "border-default-200"
                    )}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    #{tag.name}
                  </Chip>
                );
              })}
            </ScrollShadow>
          </div>
        )}
      </div>

      {/* 📂 Posts Feed Display */}
      {postsLoading || postsFetching ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card
              key={idx}
              className="bg-background/20 border-default-100 relative h-72 animate-pulse overflow-hidden rounded-2xl border p-5"
            >
              <div className="bg-default-200 h-4 w-1/4 rounded-full" />
              <div className="bg-default-200 mt-4 h-6 w-3/4 rounded-full" />
              <div className="bg-default-200 mt-2 h-4 w-5/6 rounded-full" />
              <div className="bg-default-200 mt-2 h-4 w-2/3 rounded-full" />
              <div className="absolute bottom-5 left-5 flex gap-2">
                <div className="bg-default-200 size-6 rounded-full" />
                <div className="bg-default-200 h-4 w-16 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : postsError ? (
        <Card className="border-danger/20 flex flex-col items-center justify-center border border-dashed py-16 text-center">
          <Icon icon="lucide:alert-circle" className="text-danger size-10" />
          <Typography type="body-sm" className="text-danger mt-4 font-semibold">
            Failed to retrieve articles.
          </Typography>
          <Button size="sm" variant="ghost" onPress={handleClearFilters} className="mt-6">
            Reset Filters
          </Button>
        </Card>
      ) : posts.length === 0 ? (
        <Card className="border-default-200 flex flex-col items-center justify-center border border-dashed py-20 text-center">
          <Icon icon="lucide:book-x" className="text-default-400 size-12" />
          <Typography type="h3" className="mt-4 text-lg font-bold">
            No articles found
          </Typography>
          <Typography type="body-xs" color="muted" className="mt-2 max-w-sm">
            We couldn't find any narrative or log entry that matches your search filters. Try
            resetting them.
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            onPress={handleClearFilters}
            className="mt-6 font-semibold"
          >
            Reset All Filters
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Post Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                description={post.summary || "No summary available."}
                date={new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                author={post.authorName || "Anonymous"}
                category={post.category?.name || "Unclassified"}
                href={`/blog/${post.slug}`}
              />
            ))}
          </div>

          {/* 📄 Pagination */}
          {totalPages > 1 && (
            <div className="border-default-100 flex items-center justify-between border-t pt-6">
              <Button
                size="sm"
                variant="ghost"
                isDisabled={page === 0}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-full"
              >
                <Icon icon="lucide:chevron-left" className="mr-1.5 size-4" />
                Previous
              </Button>
              <div className="text-default-400 text-xs font-semibold select-none">
                Page <span className="text-foreground">{page + 1}</span> of{" "}
                <span className="text-foreground">{totalPages}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={page >= totalPages - 1}
                onPress={() => setPage((p) => p + 1)}
                className="rounded-full"
              >
                Next
                <Icon icon="lucide:chevron-right" className="ml-1.5 size-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

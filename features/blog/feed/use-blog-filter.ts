"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";

/**
 * Custom hook to manage blog filtering and search state.
 * Encapsulates search keywords, selected categories, and pagination.
 */
export function useBlogFilter() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [debouncedKeyword] = useDebounce(searchVal, 400);
  const [page, setPage] = useState(0);

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    setPage(0); // Reset to first page on search
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setPage(0);
  };

  const handleTagToggle = (id: number) => {
    setSelectedTagId((prev) => (prev === id ? null : id));
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchVal("");
    setSelectedCategory("all");
    setSelectedTagId(null);
    setPage(0);
  };

  return {
    selectedCategory,
    selectedTagId,
    searchVal,
    debouncedKeyword,
    page,
    setPage,
    handleSearchChange,
    handleCategoryChange,
    handleTagToggle,
    handleClearFilters,
  };
}

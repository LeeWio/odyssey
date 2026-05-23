"use client";

import { useDeferredValue, useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";

import { FileTextIcon, MagnifierIcon, TargetIcon } from "@/components/icons";
import { useQuickSearchQuery } from "@/lib/features/post/post-api";
import { createNavigationCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

const MIN_REMOTE_QUERY_LENGTH = 2;
const DEFAULT_SEARCH_PAGE_SIZE = 6;

export interface PostSearchCommandState {
  commands: CommandItem[];
  isLoading: boolean;
  hasRemoteQuery: boolean;
  total: number;
  isError: boolean;
  pageSize: number;
}

export function usePostSearchCommands(query: string, pageSize = DEFAULT_SEARCH_PAGE_SIZE): PostSearchCommandState {
  const deferredQuery = useDeferredValue(query.trim());
  const hasRemoteQuery = deferredQuery.length >= MIN_REMOTE_QUERY_LENGTH;

  const { data, isFetching, isError } = useQuickSearchQuery(
    hasRemoteQuery
      ? {
          keyword: deferredQuery,
        }
      : skipToken
  );

  const commands = useMemo(
    () => [
      ...((data?.posts ?? []).slice(0, pageSize).map((post, index) =>
        createNavigationCommand({
          id: `search-post-${post.id}`,
          title: post.title,
          description: "Blog article",
          icon: FileTextIcon,
          category: "Management",
          source: "search",
          order: index,
          keywords: [
            "post",
            "blog",
            "article",
            "搜索",
            "文章",
            post.path,
          ],
          intent: CommandIntent.NAVIGATE,
          payload: { href: post.path },
        })
      ) ?? []),
      ...((data?.categories ?? []).slice(0, pageSize).map((category, index) =>
        createNavigationCommand({
          id: `search-category-${category.id}`,
          title: category.title,
          description: "Category",
          icon: TargetIcon,
          category: "Management",
          source: "search",
          order: 100 + index,
          keywords: ["category", "分类", category.path],
          intent: CommandIntent.NAVIGATE,
          payload: { href: category.path },
        })
      ) ?? []),
      ...((data?.tags ?? []).slice(0, pageSize).map((tag, index) =>
        createNavigationCommand({
          id: `search-tag-${tag.id}`,
          title: tag.title,
          description: "Tag",
          icon: MagnifierIcon,
          category: "Management",
          source: "search",
          order: 200 + index,
          keywords: ["tag", "标签", tag.path],
          intent: CommandIntent.NAVIGATE,
          payload: { href: tag.path },
        })
      ) ?? []),
    ],
    [data?.categories, data?.posts, data?.tags, pageSize]
  );

  const total = (data?.posts?.length ?? 0) + (data?.categories?.length ?? 0) + (data?.tags?.length ?? 0);

  return {
    commands,
    isLoading: isFetching,
    hasRemoteQuery,
    total,
    isError,
    pageSize: total,
  };
}

"use client";

import { useGetPublicColumnBySlugQuery } from "@/lib/features/column";
import { type PostResponse, useGetPublicPostDigestsQuery } from "@/lib/features/post";

import { resolveArticleNeighbors } from "./neighbor";

export function useArticleNeighbors(article: PostResponse, enabled: boolean) {
  const seriesSlug = article.series?.slug;
  const hasNavigation = article.navigation != null;
  const needsLookup = enabled && !hasNavigation;
  const column = useGetPublicColumnBySlugQuery(seriesSlug ?? "", {
    skip: !needsLookup || !seriesSlug,
  });
  const journal = useGetPublicPostDigestsQuery(
    { page: 0, size: 100 },
    { skip: !needsLookup || Boolean(seriesSlug) }
  );
  const neighbors = resolveArticleNeighbors({
    article,
    columnPosts: column.currentData?.posts ?? [],
    journalPosts: journal.currentData?.list ?? [],
  });

  return {
    ...neighbors,
    isLoading: !hasNavigation && (!enabled || (seriesSlug ? column.isLoading : journal.isLoading)),
  };
}

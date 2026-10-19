"use client";

import { useGetPublicColumnBySlugQuery } from "@/lib/features/column";
import { type PostResponse, useGetPublicPostDigestsQuery } from "@/lib/features/post";

import { resolveArticleNeighbors } from "./neighbor";

export function useArticleNeighbors(article: PostResponse) {
  const seriesSlug = article.series?.slug;
  const column = useGetPublicColumnBySlugQuery(seriesSlug ?? "", { skip: !seriesSlug });
  const journal = useGetPublicPostDigestsQuery(
    { page: 0, size: 100 },
    { skip: Boolean(seriesSlug) }
  );
  const neighbors = resolveArticleNeighbors({
    article,
    columnPosts: column.data?.posts ?? [],
    journalPosts: journal.data?.list ?? [],
  });

  return {
    ...neighbors,
    isLoading: Boolean(seriesSlug) ? column.isLoading : journal.isLoading,
  };
}

"use client";

import { useMemo } from "react";
import { useGetRelatedPostsQuery, type PostResponse } from "@/lib/features/post";
import { ALSO_LIKE_LIMIT, sameSubjectPosts } from "./recommendations";

export function useSameSubject(article: PostResponse, enabled: boolean) {
  const { currentData, isLoading } = useGetRelatedPostsQuery(
    { size: ALSO_LIKE_LIMIT, slug: article.slug },
    { skip: !enabled }
  );
  const items = useMemo(() => sameSubjectPosts(article, currentData), [article, currentData]);
  return { items, isLoading: !enabled || isLoading };
}

"use client";

import { useEffect, useState } from "react";

import { useAppDispatch } from "@/lib/hooks";

import { postApi } from "./post-api";
import type { PostResponse } from "./post-contracts";

const PAGE_SIZE = 100;

export function usePublishedCatalog() {
  const dispatch = useAppDispatch();
  const [attempt, setAttempt] = useState(0);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setIsError(false);
      const pages: PostResponse[][] = [];
      try {
        const first = dispatch(
          postApi.endpoints.getPublicPosts.initiate({ page: 0, size: PAGE_SIZE })
        );
        const firstPage = await first.unwrap();
        first.unsubscribe();
        pages.push(firstPage.list);
        for (let page = 1; page < firstPage.totalPages; page += 1) {
          const next = dispatch(
            postApi.endpoints.getPublicPosts.initiate({ page, size: PAGE_SIZE })
          );
          const result = await next.unwrap();
          next.unsubscribe();
          pages.push(result.list);
        }
        if (!cancelled) setPosts(pages.flat());
      } catch {
        if (!cancelled) setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [attempt, dispatch]);

  return {
    isError,
    isLoading,
    posts,
    retry: () => setAttempt((value) => value + 1),
  };
}

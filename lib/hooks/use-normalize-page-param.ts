"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { clampPageToTotal } from "@/lib/utils/pagination";

export function useNormalizePageParam(page: number, totalPages?: number) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    if (totalPages === undefined) return;

    const normalizedPage = clampPageToTotal(page, totalPages);
    const query = new URLSearchParams(queryString);
    if (normalizedPage === 1) query.delete("page");
    else query.set("page", String(normalizedPage));

    const normalizedQuery = query.toString();
    if (normalizedQuery === queryString) return;

    router.replace(`${pathname}${normalizedQuery ? `?${normalizedQuery}` : ""}`, {
      scroll: false,
    });
  }, [page, pathname, queryString, router, totalPages]);
}

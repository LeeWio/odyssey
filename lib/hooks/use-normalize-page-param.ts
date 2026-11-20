"use client";

import { useEffect } from "react";

import { clampPageToTotal } from "@/lib/utils/pagination";
import { useQueryState } from "./use-query-state";

export function useNormalizePageParam(page: number, totalPages?: number) {
  const { searchParams, updateQuery } = useQueryState();
  const queryString = searchParams.toString();

  useEffect(() => {
    if (totalPages === undefined) return;

    const normalizedPage = clampPageToTotal(page, totalPages);
    const expectedPage = normalizedPage === 1 ? null : String(normalizedPage);
    if ((searchParams.get("page") ?? null) === expectedPage) return;
    updateQuery({ page: expectedPage }, { scroll: false });
  }, [page, queryString, searchParams, totalPages, updateQuery]);
}

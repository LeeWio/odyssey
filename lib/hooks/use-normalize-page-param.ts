"use client";

import { useEffect } from "react";

import { clampPageToTotal } from "@/lib/utils/pagination";
import { useQueryState } from "./use-query-state";

export function useNormalizePageParam(
  page: number,
  totalPages?: number,
  { clientOnly = false }: { clientOnly?: boolean } = {}
) {
  const { searchParams, updateQuery } = useQueryState({ clientOnly });
  const queryString = searchParams.toString();

  useEffect(() => {
    if (totalPages === undefined) return;
    if (clientOnly && queryString !== new URLSearchParams(window.location.search).toString())
      return;

    const normalizedPage = clampPageToTotal(page, totalPages);
    const expectedPage = normalizedPage === 1 ? null : String(normalizedPage);
    if ((searchParams.get("page") ?? null) === expectedPage) return;
    updateQuery({ page: expectedPage }, { scroll: false });
  }, [clientOnly, page, queryString, searchParams, totalPages, updateQuery]);
}

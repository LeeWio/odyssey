"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type QueryValue = string | number | null | undefined;

export function useQueryState() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const updateQuery = useCallback(
    (
      changes: Record<string, QueryValue>,
      options: { mode?: "push" | "replace"; scroll?: boolean; pathname?: string } = {}
    ) => {
      const nextParams = new URLSearchParams(queryString);

      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined || value === null || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
      }

      const query = nextParams.toString();
      const nextPathname = options.pathname ?? pathname;
      const href = query ? `${nextPathname}?${query}` : nextPathname;
      router[options.mode ?? "replace"](href, { scroll: options.scroll ?? false });
    },
    [pathname, queryString, router]
  );

  return { searchParams, updateQuery };
}

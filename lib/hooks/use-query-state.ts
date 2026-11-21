"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

type QueryValue = string | number | null | undefined;

export type UpdateQueryOptions = {
  mode?: "push" | "replace";
  scroll?: boolean;
  pathname?: string;
  hash?: string;
};

export function useQueryState({ clientOnly = false }: { clientOnly?: boolean } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const queryStringRef = useRef(queryString);

  useEffect(() => {
    queryStringRef.current = queryString;
  }, [queryString]);

  const updateQuery = useCallback(
    (changes: Record<string, QueryValue>, options: UpdateQueryOptions = {}) => {
      if (clientOnly && !options.pathname && pathname !== window.location.pathname) return;
      const inPlace = clientOnly && !options.pathname && !options.scroll;
      const nextParams = new URLSearchParams(
        inPlace ? window.location.search : queryStringRef.current
      );

      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined || value === null || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
      }

      const query = nextParams.toString();
      const nextPathname = options.pathname ?? pathname;
      const hash = options.hash
        ? options.hash.startsWith("#")
          ? options.hash
          : `#${options.hash}`
        : "";
      queryStringRef.current = nextParams.toString();
      const href = `${query ? `${nextPathname}?${query}` : nextPathname}${hash}`;
      if (inPlace) {
        const liveHref = window.location.pathname + window.location.search + window.location.hash;
        if (href !== liveHref) {
          window.history[options.mode === "push" ? "pushState" : "replaceState"](null, "", href);
        }
        return;
      }
      router[options.mode ?? "replace"](href, { scroll: options.scroll ?? false });
    },
    [clientOnly, pathname, router]
  );

  return { searchParams, updateQuery };
}

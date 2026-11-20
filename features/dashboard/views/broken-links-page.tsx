"use client";

import { Button, Chip, Spinner } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useState } from "react";

import { useGetBrokenLinksQuery } from "@/lib/features/openapi/openapi-api";

const PAGE_SIZE = 20;

type BrokenLink = {
  id?: number;
  url?: string;
  sourceType?: string;
  sourceTitle?: string;
  statusCode?: number;
  errorMessage?: string;
};

type BrokenLinkPage = {
  list?: BrokenLink[];
  totalPages?: number;
};

export function BrokenLinksPage() {
  const [page, setPage] = useState(0);
  const query = useGetBrokenLinksQuery({ pageable: { page, size: PAGE_SIZE } });
  const data = query.data as BrokenLinkPage | undefined;
  const links = data?.list ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <section
      aria-labelledby="broken-links-heading"
      className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10"
    >
      <div className="flex flex-col gap-1">
        <h1 id="broken-links-heading" className="text-foreground text-2xl font-semibold">
          Broken links
        </h1>
        <p className="text-muted text-sm">
          External links the last health check marked as unreachable. This list is read only.
        </p>
      </div>

      {query.isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>Link health is unavailable</EmptyState.Title>
            <EmptyState.Description>The broken-link request failed.</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => query.refetch()} variant="secondary">
              Try again
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : links.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>No broken links</EmptyState.Title>
            <EmptyState.Description>
              The latest check did not record an unreachable link.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="divide-separator border-separator divide-y rounded-2xl border">
            {links.map((link) => (
              <li key={link.id ?? link.url} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a
                    className="text-foreground min-w-0 truncate text-sm font-medium underline"
                    href={link.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.url}
                  </a>
                  <Chip color="danger" size="sm" variant="soft">
                    {link.statusCode ?? "Failed"}
                  </Chip>
                </div>
                <p className="text-muted text-xs">
                  {[link.sourceType, link.sourceTitle].filter(Boolean).join(" · ")}
                </p>
                {link.errorMessage ? (
                  <p className="text-danger text-xs">{link.errorMessage}</p>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted text-xs tabular-nums">
              Page {page + 1} of {Math.max(totalPages, 1)}
            </p>
            <div className="flex gap-2">
              <Button
                isDisabled={page === 0 || query.isFetching}
                onPress={() => setPage((current) => Math.max(0, current - 1))}
                size="sm"
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                isDisabled={page + 1 >= totalPages || query.isFetching}
                onPress={() => setPage((current) => current + 1)}
                size="sm"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

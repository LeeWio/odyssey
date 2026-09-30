"use client";

import { Button, Card, Typography } from "@heroui/react";
import { useRef, useState } from "react";

import { useGetReadingListQuery, useRemoveFromReadingListMutation } from "@/lib/features/library";
import { useLocale, useTranslations } from "next-intl";

import { READING_LIST_PAGE_SIZE } from "./library-constants";
import { EmptyLibrarySection, LibrarySkeleton, ReadingListCard } from "./library-cards";

export function ReadingListSection() {
  const t = useTranslations("Library");
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<ReadonlySet<number>>(new Set());
  const inFlight = useRef(new Set<number>());
  const [removeFromReadingList] = useRemoveFromReadingListMutation();
  const query = useGetReadingListQuery(
    { page, size: READING_LIST_PAGE_SIZE, sort: ["addedAt,desc"] },
    { refetchOnMountOrArgChange: true }
  );
  const data = query.currentData;
  const lastPage = Math.max(0, (data?.totalPages ?? 1) - 1);
  const isAdjustingPage = query.isSuccess && !query.isFetching && !!data && page > lastPage;
  if (isAdjustingPage) setPage(lastPage);
  const isLoading = isAdjustingPage || query.isLoading || (query.isFetching && !data);

  const handleRemove = async (postId: number) => {
    if (inFlight.current.has(postId)) return;
    inFlight.current.add(postId);
    setPending(new Set(inFlight.current));
    try {
      await removeFromReadingList(postId).unwrap();
    } finally {
      inFlight.current.delete(postId);
      setPending(new Set(inFlight.current));
    }
  };

  return (
    <section
      aria-labelledby="reading-list-title"
      aria-busy={query.isFetching || isAdjustingPage}
      className="mt-20"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography id="reading-list-title" type="h2" weight="semibold">
            {t("readingListTitle")}
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            {data
              ? t("readingListCount", {
                  count: data.total.toLocaleString(locale),
                })
              : t("readingListDescription")}
          </Typography>
        </div>
      </div>

      {isLoading ? (
        <LibrarySkeleton />
      ) : query.isError ? (
        <Card variant="secondary">
          <Card.Header>
            <Card.Title>{t("readingListUnavailable")}</Card.Title>
            <Card.Description>{t("tryLoadAgain")}</Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button size="sm" variant="secondary" onPress={() => query.refetch()}>
              {t("tryAgain")}
            </Button>
          </Card.Footer>
        </Card>
      ) : !data?.list.length ? (
        <EmptyLibrarySection
          title={t("readingListEmpty")}
          description={t("readingListEmptyHint")}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.list.map((entry) => (
            <ReadingListCard
              key={entry.post.id}
              entry={entry}
              isRemoving={pending.has(entry.post.id)}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {!isAdjustingPage && (page > 0 || (data?.totalPages ?? 0) > 1) ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Typography color="muted" type="body-sm">
            {data
              ? t("pageOfArticles", {
                  page: (page + 1).toLocaleString(locale),
                  pages: data.totalPages.toLocaleString(locale),
                  count: data.total.toLocaleString(locale),
                })
              : t("pageNumber", { page: (page + 1).toLocaleString(locale) })}
          </Typography>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              isDisabled={page === 0 || query.isFetching}
              onPress={() => setPage((current) => Math.max(0, current - 1))}
            >
              {t("previous")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={query.isFetching || !data || page >= lastPage}
              onPress={() => setPage((current) => current + 1)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

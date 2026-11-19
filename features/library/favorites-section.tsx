"use client";

import { Button, Card, Typography } from "@heroui/react";
import { useState } from "react";

import { useGetFavoritePostsQuery } from "@/lib/features/library";
import { useLocale, useTranslations } from "next-intl";

import { EmptyLibrarySection, FavoriteCard, LibrarySkeleton } from "./library-cards";

const PAGE_SIZE = 6;

export function FavoritesSection() {
  const t = useTranslations("Library");
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const favorites = useGetFavoritePostsQuery(
    { page, size: PAGE_SIZE },
    { refetchOnMountOrArgChange: true }
  );
  const data = favorites.currentData;
  const lastPage = Math.max(0, (data?.totalPages ?? 1) - 1);
  const isAdjustingPage = favorites.isSuccess && !favorites.isFetching && !!data && page > lastPage;
  if (isAdjustingPage) setPage(lastPage);
  const isLoading = isAdjustingPage || (favorites.isFetching && !data);

  return (
    <section
      aria-labelledby="favorites-title"
      aria-busy={favorites.isFetching || isAdjustingPage}
      className="mt-20"
    >
      <div className="mb-6">
        <Typography id="favorites-title" type="h2" weight="semibold">
          {t("savedTitle")}
        </Typography>
        <Typography color="muted" type="body-sm" className="mt-1">
          {data && !favorites.isError
            ? t("savedCount", { count: data.total.toLocaleString(locale) })
            : t("savedDescription")}
        </Typography>
      </div>
      {isLoading ? (
        <LibrarySkeleton />
      ) : favorites.isError ? (
        <Card variant="secondary">
          <Card.Header>
            <Card.Title>{t("savedUnavailable")}</Card.Title>
            <Card.Description>{t("tryLoadAgain")}</Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button size="sm" variant="secondary" onPress={() => favorites.refetch()}>
              {t("tryAgain")}
            </Button>
          </Card.Footer>
        </Card>
      ) : data?.list.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
          {data.list.map((entry) => (
            <FavoriteCard key={entry.post.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyLibrarySection title={t("noSaved")} description={t("noSavedHint")} />
      )}

      {!isAdjustingPage && (page > 0 || lastPage > 0) ? (
        <nav aria-label={t("savedPages")} className="mt-6 flex flex-wrap items-center gap-3">
          <Typography color="muted" type="body-sm">
            {data && !favorites.isError
              ? t("pageOf", {
                  page: (page + 1).toLocaleString(locale),
                  pages: data.totalPages.toLocaleString(locale),
                })
              : t("pageNumber", { page: (page + 1).toLocaleString(locale) })}
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={page === 0 || favorites.isFetching}
            onPress={() => setPage((current) => Math.max(0, current - 1))}
          >
            {t("previous")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={favorites.isFetching || favorites.isError || page >= lastPage}
            onPress={() => setPage((current) => current + 1)}
          >
            {t("next")}
          </Button>
        </nav>
      ) : null}
    </section>
  );
}

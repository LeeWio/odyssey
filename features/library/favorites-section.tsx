"use client";

import { Typography } from "@heroui/react";

import { useGetFavoritePostsQuery } from "@/lib/features/library";
import { useTranslations } from "next-intl";

import { EmptyLibrarySection, FavoriteCard, LibrarySkeleton } from "./library-cards";

export function FavoritesSection() {
  const t = useTranslations("Library");
  const favorites = useGetFavoritePostsQuery({
    page: 0,
    size: 6,
    sort: ["favoritedAt,desc"],
  });

  return (
    <section aria-labelledby="favorites-title" className="mt-20">
      <div className="mb-6">
        <Typography id="favorites-title" type="h2" weight="semibold">
          {t("savedTitle")}
        </Typography>
        <Typography color="muted" type="body-sm" className="mt-1">
          {t("savedDescription")}
        </Typography>
      </div>
      {favorites.isLoading ? (
        <LibrarySkeleton />
      ) : favorites.isError ? (
        <EmptyLibrarySection title={t("savedUnavailable")} description={t("tryAgainHint")} />
      ) : (favorites.data?.list.length ?? 0) > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {favorites.data?.list.map((entry) => (
            <FavoriteCard key={entry.post.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyLibrarySection title={t("noSaved")} description={t("noSavedHint")} />
      )}
    </section>
  );
}

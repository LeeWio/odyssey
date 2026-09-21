"use client";

import { Typography } from "@heroui/react";

import { useGetFavoritePostsQuery } from "@/lib/features/library";

import { EmptyLibrarySection, FavoriteCard, LibrarySkeleton } from "./library-cards";

export function FavoritesSection() {
  const favorites = useGetFavoritePostsQuery({
    page: 0,
    size: 6,
    sort: ["favoritedAt,desc"],
  });

  return (
    <section aria-labelledby="favorites-title" className="mt-20">
      <div className="mb-6">
        <Typography id="favorites-title" type="h2" weight="semibold">
          Saved writing
        </Typography>
        <Typography color="muted" type="body-sm" className="mt-1">
          Articles you marked to revisit.
        </Typography>
      </div>
      {favorites.isLoading ? (
        <LibrarySkeleton />
      ) : favorites.isError ? (
        <EmptyLibrarySection
          title="Saved writing is unavailable"
          description="Try loading this page again in a moment."
        />
      ) : (favorites.data?.list.length ?? 0) > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {favorites.data?.list.map((entry) => (
            <FavoriteCard key={entry.post.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyLibrarySection
          title="No saved articles yet"
          description="Use the favorite action on an article to keep it close."
        />
      )}
    </section>
  );
}

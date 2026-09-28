"use client";

import { Button, Link, Typography } from "@heroui/react";
import { useState } from "react";

import { useGetContentPreferencesQuery, useGetFollowingFeedQuery } from "@/lib/features/library";
import { useLocale, useTranslations } from "next-intl";

import { FOLLOWING_PAGE_SIZE } from "./library-constants";
import { EmptyLibrarySection, FollowingCard, LibrarySkeleton } from "./library-cards";

export function FollowingFeedSection() {
  const t = useTranslations("Library");
  const locale = useLocale();
  const [followingPage, setFollowingPage] = useState(0);
  const preferences = useGetContentPreferencesQuery();
  const followedCategories = preferences.data?.followedCategories ?? [];
  const following = useGetFollowingFeedQuery(
    { page: followingPage, size: FOLLOWING_PAGE_SIZE, sort: ["publishedAt,desc"] },
    { skip: preferences.isLoading || followedCategories.length === 0 }
  );
  const followingPosts = following.data?.list ?? [];

  return (
    <section aria-labelledby="following-title" className="mt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography id="following-title" type="h2" weight="semibold">
            {t("followingTitle")}
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            {t("followingDescription")}
          </Typography>
        </div>
        {followedCategories.length > 0 ? (
          <Link
            className="text-accent text-sm font-medium no-underline"
            href="#reading-preferences-title"
          >
            {t("tuneTopics")}
          </Link>
        ) : null}
      </div>

      {preferences.isLoading ? (
        <LibrarySkeleton />
      ) : preferences.isError ? (
        <EmptyLibrarySection title={t("topicsUnavailable")} description={t("tryAgainHint")} />
      ) : followedCategories.length === 0 ? (
        <EmptyLibrarySection title={t("followToBuild")} description={t("followToBuildHint")} />
      ) : following.isLoading ? (
        <LibrarySkeleton />
      ) : following.isError ? (
        <EmptyLibrarySection title={t("feedUnavailable")} description={t("tryAgainHint")} />
      ) : followingPosts.length > 0 ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {followingPosts.map((post) => (
              <FollowingCard key={post.id} post={post} />
            ))}
          </div>
          {following.data && following.data.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-4">
              <Typography color="muted" type="body-xs">
                {t("followedCount", { count: following.data.total.toLocaleString(locale) })}
              </Typography>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={followingPage === 0}
                  onPress={() => setFollowingPage((page) => Math.max(0, page - 1))}
                >
                  {t("previous")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={followingPage >= following.data.totalPages - 1}
                  onPress={() => setFollowingPage((page) => page + 1)}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyLibrarySection title={t("nothingNew")} description={t("nothingNewHint")} />
      )}
    </section>
  );
}

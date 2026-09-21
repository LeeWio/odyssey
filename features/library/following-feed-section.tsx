"use client";

import { Button, Link, Typography } from "@heroui/react";
import { useState } from "react";

import { useGetContentPreferencesQuery, useGetFollowingFeedQuery } from "@/lib/features/library";

import { FOLLOWING_PAGE_SIZE } from "./library-constants";
import { EmptyLibrarySection, FollowingCard, LibrarySkeleton } from "./library-cards";

export function FollowingFeedSection() {
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
            From topics you follow
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            New writing from the subjects you asked to see more often.
          </Typography>
        </div>
        {followedCategories.length > 0 ? (
          <Link
            className="text-accent text-sm font-medium no-underline"
            href="#reading-preferences-title"
          >
            Tune topics
          </Link>
        ) : null}
      </div>

      {preferences.isLoading ? (
        <LibrarySkeleton />
      ) : preferences.isError ? (
        <EmptyLibrarySection
          title="Followed topics are unavailable"
          description="Try loading this page again in a moment."
        />
      ) : followedCategories.length === 0 ? (
        <EmptyLibrarySection
          title="Follow a topic to build your feed"
          description="Choose topics below and their latest articles will appear here."
        />
      ) : following.isLoading ? (
        <LibrarySkeleton />
      ) : following.isError ? (
        <EmptyLibrarySection
          title="Your followed feed is unavailable"
          description="Try loading this page again in a moment."
        />
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
                {following.data.total.toLocaleString("en-US")} articles from followed topics
              </Typography>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={followingPage === 0}
                  onPress={() => setFollowingPage((page) => Math.max(0, page - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={followingPage >= following.data.totalPages - 1}
                  onPress={() => setFollowingPage((page) => page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyLibrarySection
          title="Nothing new from followed topics"
          description="When new articles are published in your selected topics, they will show up here."
        />
      )}
    </section>
  );
}

"use client";

import { Link, Typography } from "@heroui/react";

import { useGetLibraryOverviewQuery } from "@/lib/features/library";

import { EmptyLibrarySection, LibrarySkeleton, ReadingCard } from "./library-cards";

export function ContinueReadingSection() {
  const overview = useGetLibraryOverviewQuery();
  const continueReading = (overview.data?.continueReading ?? []).filter(
    (entry) => entry.progressPercent < 100
  );

  return (
    <section aria-labelledby="continue-reading-title" className="mt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Typography id="continue-reading-title" type="h2" weight="semibold">
            Continue reading
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            Pick up exactly where you left off.
          </Typography>
        </div>
        <Link className="text-accent text-sm font-medium no-underline" href="/blog">
          Browse all writing
        </Link>
      </div>
      {overview.isLoading ? (
        <LibrarySkeleton />
      ) : overview.isError ? (
        <EmptyLibrarySection
          title="Reading progress is unavailable"
          description="Try loading this page again in a moment."
        />
      ) : continueReading.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {continueReading.slice(0, 6).map((entry) => (
            <ReadingCard key={entry.post.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyLibrarySection
          title="Nothing in progress"
          description="Start an article and your place will be saved here."
        />
      )}
    </section>
  );
}

"use client";

import { Link, Typography } from "@heroui/react";

import { useGetLibraryOverviewQuery } from "@/lib/features/library";
import { useTranslations } from "next-intl";

import { EmptyLibrarySection, LibrarySkeleton, ReadingCard } from "./library-cards";

export function ContinueReadingSection() {
  const t = useTranslations("Library");
  const overview = useGetLibraryOverviewQuery();
  const continueReading = (overview.data?.continueReading ?? []).filter(
    (entry) => entry.progressPercent < 100
  );

  return (
    <section aria-labelledby="continue-reading-title" className="mt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Typography id="continue-reading-title" type="h2" weight="semibold">
            {t("continueTitle")}
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            {t("continueDescription")}
          </Typography>
        </div>
        <Link className="text-accent text-sm font-medium no-underline" href="/single">
          {t("browseAllWriting")}
        </Link>
      </div>
      {overview.isLoading ? (
        <LibrarySkeleton />
      ) : overview.isError ? (
        <EmptyLibrarySection title={t("progressUnavailable")} description={t("tryAgainHint")} />
      ) : continueReading.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {continueReading.slice(0, 6).map((entry) => (
            <ReadingCard key={entry.post.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyLibrarySection
          title={t("nothingInProgress")}
          description={t("nothingInProgressHint")}
        />
      )}
    </section>
  );
}

"use client";

import { useGetPublicMomentsQuery } from "@/lib/features/moment";
import { MOMENTS_SHOWCASE_LIMIT } from "./layout";
import { MomentsMasonry } from "./moments-masonry";
import { MomentsShowcase } from "./moments-showcase";
import { SectionLoadError } from "./section-load-error";

export function MomentsShowcaseRecovery() {
  const query = useGetPublicMomentsQuery({ page: 0, size: MOMENTS_SHOWCASE_LIMIT });
  const moments = (query.data?.list ?? []).slice(0, MOMENTS_SHOWCASE_LIMIT);
  const showError = query.isError || (query.isFetching && !query.isLoading && !moments.length);
  if (!moments.length && !showError) return null;

  return (
    <MomentsShowcase>
      {showError ? (
        <SectionLoadError
          subject="moments"
          hasContent={moments.length > 0}
          isRetrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {moments.length ? <MomentsMasonry moments={moments} /> : null}
    </MomentsShowcase>
  );
}

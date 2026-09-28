"use client";

import { Typography } from "@heroui/react";
import { useState } from "react";

import { useGetLibraryOverviewQuery, useHideRecommendationMutation } from "@/lib/features/library";
import { useTranslations } from "next-intl";

import { RecommendedCard } from "./library-cards";

export function RecommendationsSection() {
  const t = useTranslations("Library");
  const overview = useGetLibraryOverviewQuery();
  const recommendations = overview.data?.recommendations ?? [];
  const [recommendationPendingRemoval, setRecommendationPendingRemoval] = useState<number | null>(
    null
  );
  const [hideRecommendation] = useHideRecommendationMutation();

  const handleHideRecommendation = async (postId: number) => {
    setRecommendationPendingRemoval(postId);
    try {
      await hideRecommendation(postId).unwrap();
    } catch {
      // The mutation displays its own failure toast.
    } finally {
      setRecommendationPendingRemoval(null);
    }
  };

  if (overview.isLoading || overview.isError || recommendations.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recommendations-title" className="mt-20">
      <div className="mb-6">
        <Typography id="recommendations-title" type="h2" weight="semibold">
          {t("recommendedTitle")}
        </Typography>
        <Typography color="muted" type="body-sm" className="mt-1">
          {t("recommendedDescription")}
        </Typography>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.slice(0, 6).map((entry) => (
          <RecommendedCard
            key={entry.post.id}
            entry={entry}
            isHiding={recommendationPendingRemoval === entry.post.id}
            onHide={handleHideRecommendation}
          />
        ))}
      </div>
    </section>
  );
}

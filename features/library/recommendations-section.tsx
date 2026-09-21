"use client";

import { Typography } from "@heroui/react";
import { useState } from "react";

import { useGetLibraryOverviewQuery, useHideRecommendationMutation } from "@/lib/features/library";

import { RecommendedCard } from "./library-cards";

export function RecommendationsSection() {
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
          Recommended for you
        </Typography>
        <Typography color="muted" type="body-sm" className="mt-1">
          Suggestions shaped by the writing you have saved and read.
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

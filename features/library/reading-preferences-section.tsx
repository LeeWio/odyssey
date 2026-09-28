"use client";

import { Button, Card, Checkbox, Chip, ScrollShadow, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

import {
  useClearHiddenRecommendationsMutation,
  useFollowCategoryMutation,
  useGetContentPreferencesQuery,
  useUnfollowCategoryMutation,
} from "@/lib/features/library";
import { useRetrieveFacetsQuery } from "@/lib/features/openapi";
import { useLocale, useTranslations } from "next-intl";

import { EmptyLibrarySection } from "./library-cards";

export function ReadingPreferencesSection() {
  const t = useTranslations("Library");
  const locale = useLocale();
  const [categoryPendingId, setCategoryPendingId] = useState<number | null>(null);
  const preferences = useGetContentPreferencesQuery();
  const { data: facets } = useRetrieveFacetsQuery();
  const [followCategory] = useFollowCategoryMutation();
  const [unfollowCategory] = useUnfollowCategoryMutation();
  const [clearHiddenRecommendations, { isLoading: isClearingHiddenRecommendations }] =
    useClearHiddenRecommendationsMutation();

  const followedCategories = preferences.data?.followedCategories ?? [];
  const followedCategoryIds = new Set(followedCategories.map((category) => category.id));
  const preferenceCategories = (facets?.categories ?? [])
    .flatMap((category) =>
      category.id != null && category.name && (category.count ?? 0) > 0
        ? [{ count: category.count ?? 0, id: category.id, name: category.name }]
        : []
    )
    .slice(0, 12);

  const handleCategoryPreference = async (categoryId: number) => {
    setCategoryPendingId(categoryId);
    try {
      if (followedCategoryIds.has(categoryId)) {
        await unfollowCategory(categoryId).unwrap();
      } else {
        await followCategory(categoryId).unwrap();
      }
    } catch {
      // The mutations display their own failure toast.
    } finally {
      setCategoryPendingId(null);
    }
  };

  const handleClearHiddenRecommendations = async () => {
    try {
      await clearHiddenRecommendations().unwrap();
    } catch {
      // The mutation displays its own failure toast.
    }
  };

  return (
    <section aria-labelledby="reading-preferences-title" className="mt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography id="reading-preferences-title" type="h2" weight="semibold">
            {t("preferencesTitle")}
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1">
            {t("preferencesDescription")}
          </Typography>
        </div>
        {preferences.data && preferences.data.hiddenPostCount > 0 ? (
          <Button
            isPending={isClearingHiddenRecommendations}
            size="sm"
            variant="secondary"
            onPress={handleClearHiddenRecommendations}
          >
            <Icon aria-hidden="true" className="size-4" icon="lucide:rotate-ccw" />
            {t("restoreHidden", {
              count: preferences.data.hiddenPostCount.toLocaleString(locale),
            })}
          </Button>
        ) : null}
      </div>

      {preferences.isLoading ? (
        <Card variant="secondary" className="gap-4 p-6">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </Card>
      ) : preferences.isError ? (
        <EmptyLibrarySection title={t("preferencesUnavailable")} description={t("tryAgainHint")} />
      ) : preferenceCategories.length > 0 ? (
        <Card variant="secondary" className="gap-5 p-6">
          <Card.Header className="gap-1 p-0">
            <Card.Title className="text-base">{t("topicsToFollow")}</Card.Title>
            <Card.Description>{t("topicsToFollowHint")}</Card.Description>
          </Card.Header>
          <ScrollShadow hideScrollBar className="max-h-56" orientation="vertical">
            <div className="grid gap-2 sm:grid-cols-2">
              {preferenceCategories.map((category) => {
                const isFollowed = followedCategoryIds.has(category.id);

                return (
                  <Checkbox
                    key={category.id}
                    isDisabled={categoryPendingId === category.id}
                    isSelected={isFollowed}
                    onChange={() => handleCategoryPreference(category.id)}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium">{category.name}</span>
                        <span className="text-muted shrink-0 text-xs tabular-nums">
                          {category.count.toLocaleString(locale)}
                        </span>
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                );
              })}
            </div>
          </ScrollShadow>
          {(preferences.data?.followedCategories.length ?? 0) > 0 ? (
            <div className="border-separator flex flex-wrap items-center gap-2 border-t pt-4">
              <Typography color="muted" type="body-xs">
                {t("following")}
              </Typography>
              {preferences.data?.followedCategories.map((category) => (
                <Chip key={category.id} size="sm" variant="soft">
                  {category.name}
                </Chip>
              ))}
            </div>
          ) : null}
        </Card>
      ) : (
        <EmptyLibrarySection title={t("noTopics")} description={t("noTopicsHint")} />
      )}
    </section>
  );
}

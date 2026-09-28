"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Link, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";

import { CollectionsSection } from "./collections-section";
import { ContinueReadingSection } from "./continue-reading-section";
import { FavoritesSection } from "./favorites-section";
import { FollowingFeedSection } from "./following-feed-section";
import { ReadingHistorySection } from "./reading-history-section";
import { ReadingPreferencesSection } from "./reading-preferences-section";
import { RecommendationsSection } from "./recommendations-section";

export function LibraryPage() {
  const t = useTranslations("Library");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-lg">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="gravity-ui:book-open" aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>{t("signInTitle")}</EmptyState.Title>
              <EmptyState.Description>{t("signInDescription")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>{t("signIn")}</Button>
              <Link className="no-underline" href="/blog">
                {t("browseArticles")}
              </Link>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-3xl">
          <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
            <Icon icon="gravity-ui:book-open" aria-hidden="true" className="size-4" />
            {t("eyebrow")}
          </div>
          <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
            {t("title")}
          </Typography>
          <Typography color="muted" type="body" className="mt-5 max-w-xl">
            {t("description")}
          </Typography>
        </header>

        <ContinueReadingSection />
        <FollowingFeedSection />
        <FavoritesSection />
        <CollectionsSection />
        <ReadingPreferencesSection />
        <RecommendationsSection />
        <ReadingHistorySection />
      </div>
    </div>
  );
}

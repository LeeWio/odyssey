"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Chip, Link, Typography } from "@heroui/react";
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
import { ReadingListSection } from "./reading-list-section";
import { ReadingPreferencesSection } from "./reading-preferences-section";
import { RecommendationsSection } from "./recommendations-section";
import { PageFrame } from "@/components/layout/page-frame";

export function LibraryPage() {
  const t = useTranslations("Library");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return (
      <PageFrame className="bg-background flex items-center">
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
              <Link className="no-underline" href="/single">
                {t("browseArticles")}
              </Link>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame className="bg-background">
      <div className="flex w-full flex-col gap-16">
        <header className="max-w-xl">
          <Chip size="sm" variant="secondary">
            {t("eyebrow")}
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
          >
            {t("title")}
          </Typography>
          <Typography color="muted" type="body" className="mt-4 leading-7">
            {t("description")}
          </Typography>
        </header>

        <ContinueReadingSection />
        <ReadingListSection />
        <FollowingFeedSection />
        <FavoritesSection />
        <CollectionsSection />
        <ReadingPreferencesSection />
        <RecommendationsSection />
        <ReadingHistorySection />
      </div>
    </PageFrame>
  );
}

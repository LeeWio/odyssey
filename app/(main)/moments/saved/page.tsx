"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";

import { MomentCard } from "@/features/moment/components/card";
import { useMomentBookmarks } from "@/features/moment/hooks/use-moment-bookmarks";
import { usePublishedMoments } from "@/lib/features/moment";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";

export default function SavedMomentsPage() {
  const t = useTranslations("Moments");
  const dispatch = useAppDispatch();
  const { ids, isAuthenticated } = useMomentBookmarks();
  const catalog = usePublishedMoments();
  const saved = catalog.moments.filter((moment) => ids.includes(moment.id));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex flex-col gap-2">
        <Link className="text-sm no-underline" href="/moments">
          {t("backToMoments")}
        </Link>
        <Typography type="h1" weight="semibold">
          {t("savedTitle")}
        </Typography>
        <Typography color="muted">{t("savedDescription")}</Typography>
      </header>

      {!isAuthenticated ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("savedSignInTitle")}</EmptyState.Title>
            <EmptyState.Description>{t("savedSignInDescription")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => dispatch(setLoginOpen(true))}>{t("signIn")}</Button>
          </EmptyState.Content>
        </EmptyState>
      ) : catalog.isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : catalog.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("unavailable")}</EmptyState.Title>
            <EmptyState.Description>{t("unavailableHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button size="sm" variant="secondary" onPress={catalog.retry}>
              {t("tryAgain")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : saved.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("savedEmpty")}</EmptyState.Title>
            <EmptyState.Description>{t("savedEmptyHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link href="/moments">{t("backToMoments")}</Link>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {saved.map((moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      )}
    </div>
  );
}

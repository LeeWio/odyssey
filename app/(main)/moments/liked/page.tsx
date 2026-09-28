"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";

import { MomentCard } from "@/features/moment/components/card";
import { useGetLikedMomentIdsQuery, usePublishedMoments } from "@/lib/features/moment";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export default function LikedMomentsPage() {
  const t = useTranslations("Moments");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const catalog = usePublishedMoments();
  const ids = catalog.moments.map((moment) => moment.id);
  const liked = useGetLikedMomentIdsQuery(ids, {
    skip: !isAuthenticated || ids.length === 0,
  });
  const likedIds = new Set(liked.data ?? []);
  const moments = catalog.moments.filter((moment) => likedIds.has(moment.id));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
      <header className="flex flex-col gap-2">
        <Link className="text-sm no-underline" href="/moments">
          {t("backToMoments")}
        </Link>
        <Typography type="h1" weight="semibold">
          {t("likedTitle")}
        </Typography>
        <Typography color="muted">{t("likedDescription")}</Typography>
      </header>

      {!isAuthenticated ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("likedSignInTitle")}</EmptyState.Title>
            <EmptyState.Description>{t("likedSignInDescription")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => dispatch(setLoginOpen(true))}>{t("signIn")}</Button>
          </EmptyState.Content>
        </EmptyState>
      ) : catalog.isLoading || liked.isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : catalog.isError || liked.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("unavailable")}</EmptyState.Title>
            <EmptyState.Description>{t("unavailableHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                catalog.retry();
                void liked.refetch();
              }}
            >
              {t("tryAgain")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : moments.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("likedEmpty")}</EmptyState.Title>
            <EmptyState.Description>{t("likedEmptyHint")}</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Link href="/moments">{t("backToMoments")}</Link>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {moments.map((moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      )}
    </div>
  );
}

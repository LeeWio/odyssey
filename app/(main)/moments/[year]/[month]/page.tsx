"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";

import { MomentCard } from "@/features/moment/components/card";
import { useMomentFeed } from "@/features/moment/hooks/use-moment-feed";
import { PageFrame } from "@/components/layout/page-frame";

function isYear(value: string) {
  return /^\d{4}$/.test(value);
}

function isMonth(value: string) {
  return /^(?:[1-9]|1[0-2])$/.test(value);
}

export default function MomentMonthPage({
  params,
}: {
  params: Promise<{ month: string; year: string }>;
}) {
  const { month: monthParam, year: yearParam } = use(params);
  const year = decodeURIComponent(yearParam);
  const month = decodeURIComponent(monthParam);
  const valid = isYear(year) && isMonth(month);
  const t = useTranslations("Moments");
  const locale = useLocale();
  const catalog = useMomentFeed(
    20,
    null,
    undefined,
    valid ? { year: Number(year), month: Number(month) } : undefined
  );
  const moments = catalog.moments;
  const heading = valid
    ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(Date.UTC(Number(year), Number(month) - 1, 1))
      )
    : `${year}-${month}`;

  return (
    <PageFrame className="bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link className="text-sm no-underline" href="/moments">
            {t("backToMoments")}
          </Link>
          <Typography type="h1" weight="semibold">
            {heading}
          </Typography>
          {!catalog.isLoading && valid ? (
            <span className="text-muted text-sm tabular-nums">
              <NumberValue locale={locale} value={moments.length}>
                {(formatted) => t("monthNotes", { count: formatted })}
              </NumberValue>
            </span>
          ) : null}
        </header>

        {catalog.isLoading ? (
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
              <Button size="sm" variant="secondary" onPress={catalog.refetch}>
                {t("tryAgain")}
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : !valid || moments.length === 0 ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>{t("monthMissing")}</EmptyState.Title>
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
    </PageFrame>
  );
}

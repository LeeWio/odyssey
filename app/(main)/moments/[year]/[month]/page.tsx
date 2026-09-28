"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";

import { MomentCard } from "@/features/moment/components/card";
import { usePublishedMoments } from "@/lib/features/moment";

function isYear(value: string) {
  return /^\d{4}$/.test(value);
}

function isMonth(value: string) {
  return /^(?:[1-9]|1[0-2])$/.test(value);
}

function momentParts(value: string) {
  const date = new Date(
    value.includes("T") && !value.endsWith("Z") && !value.includes("+") ? `${value}Z` : value
  );
  if (Number.isNaN(date.getTime())) return null;
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
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
  const catalog = usePublishedMoments();
  const moments = catalog.moments.filter((moment) => {
    const parts = momentParts(moment.createdAt);
    return parts?.year === Number(year) && parts.month === Number(month);
  });
  const heading = valid
    ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(Date.UTC(Number(year), Number(month) - 1, 1))
      )
    : `${year}-${month}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32">
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
            <Button size="sm" variant="secondary" onPress={catalog.retry}>
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
  );
}

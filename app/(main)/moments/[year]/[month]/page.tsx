"use client";

import { EmptyState, NumberValue } from "@heroui-pro/react";
import { Button, Link, Skeleton, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { useSearchParams } from "next/navigation";

import { MomentCard } from "@/features/moment/components/card";
import { useMomentFeed } from "@/features/moment/hooks/use-moment-feed";
import { PageFrame } from "@/components/layout/page-frame";
import { MomentsPagination } from "@/features/moment/components/moments-pagination";
import { parsePageParam } from "@/lib/utils/pagination";
import { useNormalizePageParam } from "@/lib/hooks/use-normalize-page-param";

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
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get("page"));
  const catalog = useMomentFeed(
    20,
    null,
    undefined,
    valid ? { year: Number(year), month: Number(month) } : undefined,
    undefined,
    page
  );
  useNormalizePageParam(page, catalog.resolvedTotalPages);
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
              <NumberValue locale={locale} value={catalog.total}>
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
          <>
            <div className="flex flex-col gap-6">
              {moments.map((moment) => (
                <MomentCard key={moment.id} moment={moment} />
              ))}
            </div>
            <MomentsPagination
              page={page}
              pages={catalog.totalPages}
              isDisabled={catalog.isFetchingPage}
              onPageChange={(nextPage) => {
                const url = new URL(window.location.href);
                if (nextPage === 1) url.searchParams.delete("page");
                else url.searchParams.set("page", String(nextPage));
                window.history.pushState(null, "", `${url.pathname}${url.search}`);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            />
          </>
        )}
      </div>
    </PageFrame>
  );
}

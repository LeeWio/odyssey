"use client";

import { NumberValue } from "@heroui-pro/react";
import { Chip, Link, Separator, Skeleton, Typography } from "@heroui/react";
import bookOpen from "@iconify-icons/fluent-color/book-open-24";
import chat from "@iconify-icons/fluent-color/chat-24";
import dataTrending from "@iconify-icons/fluent-color/data-trending-24";
import location from "@iconify-icons/fluent-color/location-ripple-24";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { DeferredContent } from "@/components/layout/deferred-content";
import { cn } from "@/lib/utils";
import { writingMonthDate, writingMonthFormat, type WritingMonth } from "./writing-history";

const WritingHistoryChart = dynamic(
  () => import("./writing-history-chart").then((module) => module.WritingHistoryChart),
  { ssr: false, loading: ChartSkeleton }
);

const metrics = [
  { key: "articles", href: "/single", icon: bookOpen },
  { key: "moments", href: "/moments", icon: chat },
  { key: "footprints", href: "/footprints", icon: location },
] as const;

const sectionLayout = "w-full min-w-0 scroll-mt-24 pt-16 pb-8 md:pt-24 md:pb-12";
const contentRail = "mx-auto w-full max-w-[76rem] px-4 sm:px-6 lg:px-8";

function ChartSkeleton() {
  return <div aria-hidden className="h-48 md:h-[25rem]" />;
}

export function HomeSiteRecordSkeleton() {
  return (
    <section id="site-record" className={sectionLayout} aria-hidden>
      <div className={cn(contentRail, "flex flex-col gap-12")}>
        <Skeleton className="h-24 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map(({ key }) => (
            <Skeleton key={key} className="h-40" />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    </section>
  );
}

export function HomeSiteRecord({
  articleCount,
  momentCount,
  footprintCount,
  history,
}: {
  articleCount: number | null;
  momentCount: number | null;
  footprintCount: number;
  history: WritingMonth[] | null;
}) {
  const t = useTranslations("Home.siteRecord");
  const locale = useLocale();
  const format = useFormatter();
  const counts = { articles: articleCount, moments: momentCount, footprints: footprintCount };
  const latestMonth = history?.at(-1);

  useEffect(() => {
    if (window.location.hash !== "#site-record") return;

    const section = document.getElementById("site-record");
    if (!section?.parentElement) return;

    // Earlier home sections stream in after the browser's initial anchor scroll.
    const alignSection = () => section.scrollIntoView({ block: "start", behavior: "instant" });
    const layout = new ResizeObserver(alignSection);
    layout.observe(section.parentElement);

    const listeners = new AbortController();
    const release = () => {
      layout.disconnect();
      listeners.abort();
    };
    for (const event of ["pointerdown", "wheel", "keydown", "hashchange"]) {
      window.addEventListener(event, release, { capture: true, signal: listeners.signal });
    }

    return release;
  }, []);

  return (
    <section id="site-record" aria-labelledby="site-record-title" className={sectionLayout}>
      <div className={contentRail}>
        <header className="max-w-2xl">
          <Chip size="sm" variant="soft" color="accent">
            <Chip.Label>{t("eyebrow")}</Chip.Label>
          </Chip>
          <Typography
            id="site-record-title"
            type="h2"
            weight="semibold"
            className="mt-4 text-[clamp(2.125rem,4vw,3.25rem)] leading-[1.12] tracking-tight text-balance"
          >
            {t("title")}
          </Typography>
          <Typography
            type="body"
            color="muted"
            className="mt-2 text-base leading-relaxed md:mt-3 md:text-lg"
          >
            {t("description")}
          </Typography>
        </header>

        <ul role="list" className="mt-7 grid md:mt-12 md:grid-cols-3">
          {metrics.map(({ key, href, icon }, index) => {
            const count = counts[key];

            return (
              <li key={key} className="relative min-w-0">
                {index > 0 && (
                  <>
                    <Separator isDecorative className="absolute inset-x-0 top-0 md:hidden" />
                    <Separator
                      isDecorative
                      orientation="vertical"
                      className="absolute inset-y-0 start-0 hidden h-full md:block"
                    />
                  </>
                )}
                <Link
                  href={href}
                  className={cn(
                    "group grid h-full w-full grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 py-5 text-start decoration-transparent md:flex md:flex-col md:gap-0 md:py-1 md:pe-7",
                    index > 0 && "md:ps-8 xl:ps-10"
                  )}
                >
                  <Icon
                    icon={icon}
                    aria-hidden
                    className="mt-1 size-7 shrink-0 md:mt-0 md:mb-4 md:size-8"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:flex-col md:items-start md:gap-2.5">
                      <span className="text-foreground font-sans text-[52px] leading-[54px] font-medium tracking-[-0.04em] tabular-nums sm:text-6xl sm:leading-none">
                        {count === null ? (
                          <span aria-label={t("countUnavailable")}>—</span>
                        ) : (
                          <NumberValue value={count} maximumFractionDigits={0} locale={locale} />
                        )}
                      </span>
                      <span className="text-foreground group-hover:text-accent group-focus-visible:text-accent text-base font-semibold">
                        {t(`${key}.title`)}
                      </span>
                    </span>
                    <span className="text-muted mt-1.5 block text-sm leading-relaxed md:mt-2">
                      {t(`${key}.description`)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <figure aria-labelledby="writing-history-title" className="relative mt-10 md:mt-[4.5rem]">
        <figcaption
          className={cn(
            contentRail,
            latestMonth && "pointer-events-none relative z-10 md:absolute md:inset-x-0 md:top-3"
          )}
        >
          <Icon icon={dataTrending} aria-hidden className="mb-3 block size-6 md:mb-4 md:size-7" />
          <Typography
            id="writing-history-title"
            type="h3"
            weight="semibold"
            className="text-base md:text-lg"
          >
            {t("chart.title")}
          </Typography>
          {latestMonth ? (
            <div className="mt-3 md:mt-5">
              <div className="text-foreground text-4xl leading-none font-medium tracking-tight tabular-nums md:text-[3.25rem]">
                <NumberValue value={latestMonth.total} maximumFractionDigits={0} locale={locale} />
              </div>
              <Typography type="body-sm" color="muted" className="mt-1.5">
                {t("chart.totalLabel")}
              </Typography>
            </div>
          ) : (
            <Typography type="body-sm" color="muted" className="mt-3">
              {t(history ? "chart.empty" : "chart.unavailable")}
            </Typography>
          )}
        </figcaption>

        {history && latestMonth && (
          <>
            <DeferredContent className="mt-3 w-full md:mt-0" fallback={<ChartSkeleton />}>
              <WritingHistoryChart months={history} />
            </DeferredContent>
            <div className={cn(contentRail, "mt-4")}>
              <details className="max-w-md">
                <summary className="focus-visible:outline-focus cursor-pointer rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4">
                  {t("chart.monthlyDetails")}
                </summary>
                <ul role="list" className="divide-separator mt-3 divide-y text-sm">
                  {history.map(({ id, total }) => (
                    <li key={id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
                      <time dateTime={id}>
                        {format.dateTime(writingMonthDate(id), writingMonthFormat)}
                      </time>
                      <span className="text-muted tabular-nums">
                        {t("chart.monthTotal", { count: total })}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </>
        )}
      </figure>
    </section>
  );
}

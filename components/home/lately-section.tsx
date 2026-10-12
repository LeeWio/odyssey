"use client";

import { Section } from "@/components/layout/section";
import { ShaderBackground } from "@/components/background/shader-background";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "./layout";

import { createPageReveal, pageEaseOut } from "@/lib/motion";

import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import {
  MotionCard,
  MotionChip,
  MotionItemCard,
  MotionKPI,
  MotionTypography,
} from "@/components/ui";
import { useGetMarketIndexBySymbolQuery } from "@/lib/features/market";
import { useGetGitHubActivityQuery } from "@/lib/features/github";
import { formatActivityPeriod } from "./github-activity-format";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { ItemCard, TrendChip } from "@heroui-pro/react";
import { KPI } from "@heroui-pro/react/kpi";
import { Card, Chip, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMounted } from "@mantine/hooks";
import { motion } from "motion/react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useLocale, useTranslations } from "next-intl";

const RepositoryActivityPanel = dynamic(
  () =>
    import("@/components/home/repository-activity").then((mod) => ({
      default: mod.RepositoryActivity,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="mt-4 h-40 w-full rounded-2xl" />,
  }
);

const mapSparkline = (data?: number[]) => {
  if (!data || data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  return data.map((value) => ({
    value: range === 0 ? 50 : ((value - min) / range) * 100,
  }));
};

function ListeningShader() {
  return (
    <ShaderBackground
      aria-hidden="true"
      colorBack="#172b3a"
      colors={["#2b5876", "#4e9a9a", "#d7a86e"]}
      distortion={0.18}
      distortionFreq={7}
      falloff={0.24}
      focalAngle={2.2}
      focalDistance={0.66}
      frame={0}
      mixing={0.62}
      radius={0.95}
      speed={0.08}
      variant="static-radial-gradient"
    />
  );
}

export function LatelySection() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const mounted = useMounted();
  const shouldReduceMotion = useReducedMotionPreference();
  const { data: nasdaqData, isLoading: isNasdaqLoading } = useGetMarketIndexBySymbolQuery(
    { symbol: ".ixic", period: "1D" },
    { pollingInterval: 300000, refetchOnFocus: true }
  );
  const isPositive = nasdaqData ? nasdaqData.changePct >= 0 : false;
  const sparklineData = useMemo(() => mapSparkline(nasdaqData?.sparkline), [nasdaqData?.sparkline]);
  const { data: githubActivity, isLoading: isGitHubActivityLoading } = useGetGitHubActivityQuery(
    undefined,
    { pollingInterval: 3600000, refetchOnFocus: true }
  );
  const githubPeriodLabel = githubActivity
    ? formatActivityPeriod(githubActivity.month, locale, githubActivity.periodLabel)
    : t("lately.periodFallback");

  const { revealInView } = createPageReveal(shouldReduceMotion);

  return (
    <Section id="lately" aria-labelledby="lately-title">
      <header className={HOME_SECTION_HEADER_CENTERED}>
        <MotionChip size="sm" color="default" variant="secondary" {...revealInView(0, 10)}>
          {t("lately.sectionLabel")}
        </MotionChip>
        <MotionTypography
          id="lately-title"
          align="center"
          type="h2"
          weight="bold"
          className={HOME_SECTION_TITLE}
          {...revealInView(0.06)}
        >
          {t("lately.sectionTitle")}
        </MotionTypography>
        <MotionTypography
          align="center"
          type="body"
          color="muted"
          className={HOME_SECTION_DESCRIPTION}
          {...revealInView(0.12, 14)}
        >
          {t("lately.sectionDescription")}
        </MotionTypography>
      </header>

      <div className={`${HOME_SECTION_CONTENT} grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6`}>
        <MotionCard
          variant="secondary"
          className="group relative min-h-[34rem] overflow-hidden lg:col-span-7"
          {...revealInView(0.08, 28)}
        >
          <div className="absolute inset-0 opacity-70">
            <ListeningShader />
            <div className="from-background/10 via-surface-secondary/65 to-surface-secondary absolute inset-0 bg-linear-to-b" />
          </div>

          <Card.Header className="relative flex-row items-start justify-between">
            <Chip size="sm" variant="soft">
              {t("lately.trackBadge")}
            </Chip>
            <Typography
              aria-hidden="true"
              color="muted"
              type="body-xs"
              className="font-mono tracking-normal"
            >
              {t("lately.trackEyebrow")}
            </Typography>
          </Card.Header>

          <Card.Content className="relative mt-auto gap-7">
            <motion.div
              className="relative aspect-square w-full max-w-64 overflow-hidden rounded-[1.75rem] shadow-2xl shadow-black/30 sm:max-w-72"
              whileInView={shouldReduceMotion ? undefined : { rotate: [-1.5, 0] }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, ease: pageEaseOut }}
            >
              <ListeningShader />
              <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
                <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-white/70 uppercase">
                  <span>{t("lately.listeningLabel")}</span>
                  <span>01</span>
                </div>
                <div>
                  <p className="text-3xl leading-none font-semibold tracking-normal">老歌</p>
                  <p className="mt-2 text-xs text-white/75">安泊猜想</p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] border border-black/10 dark:border-white/10" />
            </motion.div>

            <div className="max-w-lg">
              <Typography type="h3" weight="semibold" className="tracking-normal">
                {t("lately.trackTitle")}
              </Typography>
              <Typography color="muted" type="body-sm" className="mt-2 leading-6">
                {t("lately.trackDescription")}
              </Typography>
            </div>
          </Card.Content>

          <Card.Footer className="relative mt-2">
            <MotionItemCard className="w-full" variant="transparent">
              <ItemCard.Content>
                <ItemCard.Title>老歌</ItemCard.Title>
                <ItemCard.Description>安泊猜想</ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <Chip size="sm" variant="soft">
                  {t("lately.streamingStatus")}
                </Chip>
              </ItemCard.Action>
            </MotionItemCard>
          </Card.Footer>
        </MotionCard>

        <MotionCard
          variant="transparent"
          className="border-separator relative min-h-[34rem] border px-7 py-8 lg:col-span-5 lg:px-8"
          {...revealInView(0.14, 28)}
        >
          <Card.Header className="p-0">
            <Typography color="muted" type="body-xs" className="font-mono tracking-normal">
              {t("lately.fieldSignal")}
            </Typography>
            <Card.Title className="mt-6 text-2xl tracking-normal">
              {t("lately.marketTitle")}
            </Card.Title>
            <Card.Description className="mt-2 max-w-sm leading-6">
              {t("lately.marketDescription")}
            </Card.Description>
          </Card.Header>

          <Card.Content className="mt-auto p-0 pt-12">
            {!mounted || (isNasdaqLoading && !nasdaqData) ? (
              <div
                aria-label={t("lately.loadingMarket")}
                aria-live="polite"
                className="grid min-h-28 grid-cols-2 items-end gap-6"
              >
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : nasdaqData ? (
              <MotionKPI variant="transparent">
                <KPI.Header>
                  <Icon aria-hidden="true" icon="gravity-ui:target-dart" />
                  <KPI.Title>NASDAQ</KPI.Title>
                </KPI.Header>
                <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                  <div className="flex flex-col gap-2">
                    <KPI.Value
                      className="text-foreground font-mono text-3xl leading-none font-black tabular-nums"
                      maximumFractionDigits={2}
                      value={nasdaqData.current}
                    />
                    <TrendChip trend={isPositive ? "up" : "down"} variant="tertiary">
                      <TrendChip.Indicator>
                        {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      </TrendChip.Indicator>
                      <span className="font-mono font-semibold tabular-nums">
                        {Math.abs(nasdaqData.changePct).toFixed(2)}%
                      </span>
                      <TrendChip.Suffix>{t("lately.today")}</TrendChip.Suffix>
                    </TrendChip>
                  </div>
                  <KPI.Chart
                    color="var(--color-accent)"
                    data={sparklineData}
                    height={60}
                    strokeWidth={1.5}
                  />
                </KPI.Content>
              </MotionKPI>
            ) : (
              <div className="flex min-h-28 items-center gap-3" role="status">
                <span className="bg-default-100 text-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Icon aria-hidden="true" icon="gravity-ui:chart-line" />
                </span>
                <div>
                  <Typography type="body-sm" weight="semibold">
                    {t("lately.marketUnavailable")}
                  </Typography>
                  <Typography color="muted" type="body-xs">
                    {t("lately.marketUnavailableHint")}
                  </Typography>
                </div>
              </div>
            )}
          </Card.Content>
        </MotionCard>

        <MotionCard
          variant="tertiary"
          className="relative min-h-[30rem] overflow-hidden lg:col-span-12 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12 lg:p-12"
          {...revealInView(0.18, 24)}
        >
          {/* Left side: Editorial introduction */}
          <div className="relative flex flex-col gap-5 p-6 lg:p-0">
            <div>
              <Typography
                type="body-xs"
                color="muted"
                className="font-mono tracking-normal uppercase"
              >
                {t("lately.trainingEyebrow")}
              </Typography>
              <Card.Title className="mt-4 text-3xl font-bold tracking-normal">
                {t("lately.trainingTitle")}
              </Card.Title>
              <Card.Description className="mt-2 max-w-sm text-sm leading-relaxed">
                {t("lately.trainingDescription")}
              </Card.Description>
            </div>
            <span className="bg-default-100/50 my-1 h-px w-24" />
            <Typography
              type="body-sm"
              color="muted"
              className="max-w-md text-sm leading-relaxed italic"
            >
              {t("lately.trainingQuote")}
            </Typography>
          </div>

          <div className="relative grid gap-4 p-6 sm:grid-cols-3 lg:p-0">
            {!mounted || (isGitHubActivityLoading && !githubActivity) ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    aria-hidden="true"
                    className="bg-background/40 rounded-2xl p-5 shadow-sm"
                  >
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="mt-4 h-8 w-16 rounded-lg" />
                    <Skeleton className="mt-4 h-2 w-full rounded-full" />
                  </div>
                ))}
              </>
            ) : githubActivity?.available ? (
              <>
                <KPI className="bg-background/40 rounded-2xl p-5 shadow-sm">
                  <KPI.Header>
                    <KPI.Title className="text-muted font-mono text-xs font-bold tracking-normal uppercase">
                      {t("lately.commits")}
                    </KPI.Title>
                  </KPI.Header>
                  <KPI.Content className="mt-2.5 items-end gap-1">
                    <KPI.Value
                      className="text-foreground font-mono text-2xl leading-none font-black tabular-nums"
                      value={githubActivity.totalCommits}
                      style="decimal"
                      maximumFractionDigits={0}
                    />
                    <div className="text-muted/60 mt-1 font-mono text-[10px] font-medium">
                      {githubPeriodLabel}
                    </div>
                  </KPI.Content>
                </KPI>

                <KPI className="bg-background/40 rounded-2xl p-5 shadow-sm">
                  <KPI.Header>
                    <KPI.Title className="text-muted font-mono text-xs font-bold tracking-normal uppercase">
                      {t("lately.repositories")}
                    </KPI.Title>
                  </KPI.Header>
                  <KPI.Content className="mt-2.5 items-end gap-1">
                    <KPI.Value
                      className="text-foreground font-mono text-2xl leading-none font-black tabular-nums"
                      value={githubActivity.commitRepositories.length}
                      style="decimal"
                      maximumFractionDigits={0}
                    />
                    <div className="text-muted/60 mt-1 font-mono text-[10px] font-medium">
                      {t("lately.repositoriesWithCommits")}
                    </div>
                  </KPI.Content>
                </KPI>

                <KPI className="bg-background/40 rounded-2xl p-5 shadow-sm">
                  <KPI.Header>
                    <KPI.Title className="text-muted font-mono text-xs font-bold tracking-normal uppercase">
                      {t("lately.reviews")}
                    </KPI.Title>
                  </KPI.Header>
                  <KPI.Content className="mt-2.5 items-end gap-1">
                    <KPI.Value
                      className="text-foreground font-mono text-2xl leading-none font-black tabular-nums"
                      value={githubActivity.totalReviews}
                      style="decimal"
                      maximumFractionDigits={0}
                    />
                    <div className="text-muted/60 mt-1 font-mono text-[10px] font-medium">
                      {t("lately.codeReviews")}
                    </div>
                  </KPI.Content>
                </KPI>
              </>
            ) : (
              <div
                className="bg-background/40 col-span-full flex min-h-28 items-center gap-3 rounded-2xl p-5 shadow-sm"
                role="status"
              >
                <span className="bg-default-100 text-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Icon aria-hidden="true" icon="gravity-ui:code-commits" />
                </span>
                <div>
                  <Typography type="body-sm" weight="semibold">
                    {t("lately.telemetryUnavailable")}
                  </Typography>
                  <Typography color="muted" type="body-xs">
                    {t("lately.telemetryUnavailableHint")}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </MotionCard>
      </div>

      <motion.section
        aria-labelledby="github-activity-title"
        className="mt-20 grid w-full min-w-0 gap-12 lg:gap-16"
        {...revealInView(0.2, 20)}
      >
        <div className="flex w-full min-w-0 flex-col items-center text-center">
          <Typography color="muted" type="body-xs" className="font-mono tracking-normal uppercase">
            {t("lately.developmentLog")}
          </Typography>
          <Typography
            id="github-activity-title"
            type="h2"
            weight="bold"
            className="mt-4 text-3xl leading-tight tracking-normal text-balance sm:text-4xl"
          >
            {t("lately.buildTitle")}
          </Typography>
          <Typography
            color="muted"
            type="body"
            className="mt-5 leading-relaxed text-balance italic"
          >
            {t("lately.buildDescription")}
          </Typography>
        </div>

        <div className="flex w-full min-w-0 justify-center">
          {!mounted || (isGitHubActivityLoading && !githubActivity) ? (
            <div
              aria-label={t("lately.loadingGithub")}
              aria-live="polite"
              className="w-full max-w-[620px] min-w-0"
            >
              <Skeleton className="mb-6 h-5 w-32 rounded-md" />
              <div className="grid gap-5 pl-9">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            </div>
          ) : githubActivity?.available ? (
            <RepositoryActivityPanel activity={githubActivity} />
          ) : (
            <Card className="w-full max-w-[620px] min-w-0 p-5" variant="secondary">
              <Card.Title className="text-sm">{t("lately.githubUnavailable")}</Card.Title>
              <Card.Description className="mt-1 text-xs">
                {t("lately.githubUnavailableHint")}
              </Card.Description>
            </Card>
          )}
        </div>
      </motion.section>
    </Section>
  );
}

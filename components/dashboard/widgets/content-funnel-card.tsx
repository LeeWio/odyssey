"use client";

import { Button, Card, ProgressBar } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useLocale, useTranslations } from "next-intl";

import { useGetContentFunnelQuery } from "@/lib/features/dashboard";

export function ContentFunnelCard({ days = 30 }: { days?: number }) {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const { data, isError, isLoading, refetch } = useGetContentFunnelQuery(days);
  const steps = data
    ? [
        { count: data.impressions, label: t("widgets.impressions") },
        { count: data.clicks, label: t("widgets.clicks") },
        { count: data.readers25Percent, label: t("widgets.read25") },
        { count: data.readers50Percent, label: t("widgets.read50") },
        { count: data.readers75Percent, label: t("widgets.read75") },
        { count: data.completedReads, label: t("widgets.finished") },
      ]
    : [];
  const widest = Math.max(1, ...steps.map((step) => step.count));

  return (
    <Card>
      <Card.Header className="items-start gap-1">
        <Card.Title className="text-base">{t("widgets.contentFunnel")}</Card.Title>
        <Card.Description>
          Last 30 days. Click-through {formatRate(data?.clickThroughRate)} · completion{" "}
          {formatRate(data?.completionRate)}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <p className="text-muted text-sm">{t("widgets.loadingFunnel")}</p>
        ) : isError ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>{t("widgets.funnelUnavailable")}</EmptyState.Title>
              <EmptyState.Description>{t("widgets.funnelFailed")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => refetch()} size="sm" variant="secondary">
                {t("common.retry")}
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {steps.map((step) => (
              <li key={step.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{step.label}</span>
                  <span className="tabular-nums">{step.count.toLocaleString(locale)}</span>
                </div>
                <ProgressBar aria-label={step.label} maxValue={widest} size="sm" value={step.count}>
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              </li>
            ))}
            <li className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                {t("widgets.likes")} {data?.likes.toLocaleString(locale)}
              </span>
              <span>
                {t("widgets.favorites")} {data?.favorites.toLocaleString(locale)}
              </span>
              <span>
                {t("widgets.subscriptions")} {data?.verifiedSubscriptions.toLocaleString(locale)}
              </span>
              <span>
                {t("widgets.returning")} {data?.returningVisitors.toLocaleString(locale)}
              </span>
            </li>
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}

function formatRate(value: number | undefined) {
  return `${(value ?? 0).toFixed(1)}%`;
}

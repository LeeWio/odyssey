"use client";

import { Button, Card, Chip } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useLocale, useTranslations } from "next-intl";

import { useGetContentOperationsOverviewQuery } from "@/lib/features/dashboard";

const SEVERITY_COLOR = {
  CRITICAL: "danger",
  INFO: "default",
  WARNING: "warning",
} as const;

export function ContentOperationsCard() {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const { data, isError, isLoading, refetch } = useGetContentOperationsOverviewQuery();
  const summary = data?.summary;
  const attention = data?.attentionItems ?? [];

  return (
    <Card>
      <Card.Header className="items-start gap-2">
        <Card.Title className="text-base">{t("widgets.contentOperations")}</Card.Title>
        <Card.Description>{t("widgets.contentOperationsDescription")}</Card.Description>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <p className="text-muted text-sm">{t("widgets.loadingOperations")}</p>
        ) : isError ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>{t("widgets.operationsUnavailable")}</EmptyState.Title>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => refetch()} size="sm" variant="secondary">
                {t("common.retry")}
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat
                label={t("widgets.published")}
                value={summary?.publishedPosts ?? 0}
                locale={locale}
              />
              <Stat label={t("widgets.moments")} value={summary?.moments ?? 0} locale={locale} />
              <Stat
                label={t("widgets.commentsWaiting")}
                value={summary?.pendingComments ?? 0}
                locale={locale}
              />
              <Stat
                label={t("widgets.subscribers")}
                value={summary?.activeSubscribers ?? 0}
                locale={locale}
              />
            </dl>
            {attention.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {attention.slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-muted text-xs">{item.description}</p>
                    </div>
                    <Chip color={SEVERITY_COLOR[item.severity]} size="sm" variant="soft">
                      {item.count}
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">{t("widgets.nothingNeedsAttention")}</p>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function Stat({ label, locale, value }: { label: string; locale: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="tabular-nums">{value.toLocaleString(locale)}</dd>
    </div>
  );
}

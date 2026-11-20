"use client";

import { Button, Card, Chip } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useGetNotificationDeliveryOverviewQuery } from "@/lib/features/notification/notification-delivery-api";

const DELIVERY_LABEL_KEYS = ["QUEUED", "SENDING", "FAILED", "DELIVERED", "ABANDONED"] as const;

export function NotificationDeliveryCard() {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const tDelivery = useTranslations("NotificationDelivery");
  const tNav = useTranslations("Nav");
  const router = useRouter();
  const query = useGetNotificationDeliveryOverviewQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus: true,
  });
  const counts = query.data?.counts ?? {};
  const failed = (counts.FAILED ?? 0) + (counts.ABANDONED ?? 0);

  return (
    <Card>
      <Card.Header className="items-start gap-2">
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <Card.Title className="text-base">{t("widgets.notificationDelivery")}</Card.Title>
            <Card.Description>{t("widgets.notificationDeliveryDescription")}</Card.Description>
          </div>
          {query.data ? (
            <Chip color={failed > 0 ? "warning" : "success"} size="sm" variant="soft">
              {failed > 0 ? `${failed} · ${t("widgets.commentsWaiting")}` : t("widgets.realtime")}
            </Chip>
          ) : null}
        </div>
      </Card.Header>
      <Card.Content>
        {query.isLoading ? (
          <p className="text-muted text-sm">{t("widgets.loadingDelivery")}</p>
        ) : query.isError || !query.data ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>{t("widgets.deliveryUnavailable")}</EmptyState.Title>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => query.refetch()} size="sm" variant="secondary">
                {t("common.retry")}
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label={t("widgets.pending")} value={query.data.pending} locale={locale} />
              <Stat label={t("widgets.overdue")} value={query.data.overdue} locale={locale} />
              <Stat label={t("widgets.failed")} value={failed} locale={locale} />
              <Stat label={t("widgets.delivered")} value={counts.DELIVERED ?? 0} locale={locale} />
            </dl>
            <div className="flex flex-wrap gap-2">
              {DELIVERY_LABEL_KEYS.map((status) => (
                <Chip key={status} size="sm" variant="soft">
                  {tDelivery(`status.${status}`)}: {(counts[status] ?? 0).toLocaleString(locale)}
                </Chip>
              ))}
            </div>
            <Button
              className="self-start"
              size="sm"
              variant="ghost"
              onPress={() => router.push("/notifications")}
            >
              {tNav("notifications")}
            </Button>
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

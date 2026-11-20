"use client";

import { Card, Switch } from "@heroui/react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGetVisitorsQuery } from "@/lib/features/dashboard";
import { formatAnalyticsTimestamp } from "@/lib/features/dashboard/analytics-time";

function placeOf(visitor: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  return [visitor.city, visitor.region, visitor.country].filter(Boolean).join(" · ") || "—";
}

export function VisitorsCard() {
  const t = useTranslations("Dashboard");
  const [includeOwner, setIncludeOwner] = useState(false);
  const { data, isFetching } = useGetVisitorsQuery({ days: 7, includeOwner });
  const visitors = data?.list ?? [];

  return (
    <Card>
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">{t("widgets.visitors")}</Card.Title>
          <Card.Description>
            {t("widgets.lastSevenDays")} · {data?.total ?? 0}{" "}
            {t("widgets.visitors").toLocaleLowerCase()}
            {isFetching ? ` · ${t("widgets.refreshing")}` : ""}
          </Card.Description>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            aria-label={t("widgets.includeMyVisits")}
            isSelected={includeOwner}
            onChange={setIncludeOwner}
            size="sm"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <span className="text-muted text-xs">{t("widgets.includeMyVisits")}</span>
        </div>
      </Card.Header>
      <Card.Content className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">{t("widgets.ip")}</th>
              <th className="py-2 pr-3 font-medium">{t("widgets.place")}</th>
              <th className="py-2 pr-3 font-medium">{t("widgets.client")}</th>
              <th className="py-2 pr-3 font-medium">{t("widgets.device")}</th>
              <th className="py-2 pr-3 font-medium">{t("widgets.lastSeen")}</th>
              <th className="py-2 pr-3 font-medium">{t("widgets.views")}</th>
              <th className="py-2 font-medium">{t("widgets.pages")}</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td className="text-muted py-6" colSpan={7}>
                  {t("widgets.noReaderViews")}
                </td>
              </tr>
            ) : (
              visitors.map((visitor) => (
                <tr key={visitor.visitorHash} className="border-border/60 border-t">
                  <td className="py-2 pr-3 font-mono text-xs">{visitor.ipAddress || "—"}</td>
                  <td className="py-2 pr-3">{placeOf(visitor)}</td>
                  <td className="py-2 pr-3">
                    {visitor.clientName || t("widgets.unknown")}
                    {visitor.osName ? ` · ${visitor.osName}` : ""}
                  </td>
                  <td className="py-2 pr-3">{visitor.deviceType || "—"}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {formatAnalyticsTimestamp(visitor.lastSeen)}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{visitor.views}</td>
                  <td className="py-2 tabular-nums">{visitor.pages}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card.Content>
    </Card>
  );
}

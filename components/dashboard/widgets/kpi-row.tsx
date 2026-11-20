"use client";

import { KPI } from "@heroui-pro/react/kpi";
import { useTranslations } from "next-intl";
import { useGetDashboardStatsQuery } from "@/lib/features/dashboard";

export function KpiRow() {
  const t = useTranslations("Dashboard");
  const { data: stats } = useGetDashboardStatsQuery();
  const cards = [
    {
      label: t("overview.systemUsers"),
      trend: "up" as const,
      trendValue: t("widgets.realtime"),
      value: stats?.totalUsers ?? 0,
    },
    {
      label: t("nav.posts"),
      trend: "up" as const,
      trendValue: t("widgets.realtime"),
      value: stats?.totalPosts ?? 0,
    },
    {
      label: t("nav.comments"),
      trend: "up" as const,
      trendValue: t("widgets.realtime"),
      value: stats?.totalComments ?? 0,
    },
    {
      label: t("common.views"),
      trend: "up" as const,
      trendValue: t("widgets.realtime"),
      value: stats?.totalViews ?? 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <KPI key={stat.label}>
          <KPI.Header>
            <KPI.Title>{stat.label}</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value maximumFractionDigits={0} style="decimal" value={stat.value} />
            <KPI.Trend trend={stat.trend}>{stat.trendValue}</KPI.Trend>
          </KPI.Content>
        </KPI>
      ))}
    </div>
  );
}

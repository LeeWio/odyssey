"use client";

import { KPI } from "@heroui-pro/react/kpi";
import { useGetDashboardStatsQuery } from "@/lib/features/dashboard";

export function KpiRow() {
  const { data: stats } = useGetDashboardStatsQuery();
  const cards = [
    { label: "Users", trend: "up" as const, trendValue: "Live", value: stats?.totalUsers ?? 0 },
    { label: "Posts", trend: "up" as const, trendValue: "Live", value: stats?.totalPosts ?? 0 },
    {
      label: "Comments",
      trend: "up" as const,
      trendValue: "Live",
      value: stats?.totalComments ?? 0,
    },
    { label: "Views", trend: "up" as const, trendValue: "Live", value: stats?.totalViews ?? 0 },
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

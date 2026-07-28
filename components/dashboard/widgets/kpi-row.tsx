"use client";

import { Skeleton } from "@heroui/react";
import { KPI } from "@heroui-pro/react";
import { useGetDashboardStatsQuery } from "@/lib/features/dashboard/dashboard-api";
import { Icon } from "@iconify/react";

export function KpiRow() {
  const { data: stats, isLoading } = useGetDashboardStatsQuery();

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: "gravity-ui:person",
      color: "text-blue-500",
    },
    {
      label: "Total Posts",
      value: stats?.totalPosts ?? 0,
      icon: "gravity-ui:file-text",
      color: "text-accent",
    },
    {
      label: "Total Comments",
      value: stats?.totalComments ?? 0,
      icon: "gravity-ui:comment",
      color: "text-success",
    },
    {
      label: "Total Views",
      value: stats?.totalViews ?? 0,
      icon: "gravity-ui:eye",
      color: "text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <KPI key={stat.label}>
          <KPI.Header className="flex-row items-center justify-between">
            <KPI.Title className="text-muted text-xs font-bold tracking-wider uppercase">
              {stat.label}
            </KPI.Title>
            <Icon icon={stat.icon} className={`size-4 ${stat.color} opacity-80`} />
          </KPI.Header>
          <KPI.Content>
            {isLoading ? (
              <Skeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <KPI.Value maximumFractionDigits={0} value={stat.value} />
            )}
          </KPI.Content>
        </KPI>
      ))}
    </div>
  );
}

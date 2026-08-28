"use client";

import { Skeleton } from "@heroui/react";
import { KPI } from "@heroui-pro/react";
import { Comment, Eye, FileText, Person } from "@gravity-ui/icons";
import { useGetDashboardStatsQuery } from "@/lib/features/dashboard";

export function KpiRow() {
  const { data: stats, isLoading } = useGetDashboardStatsQuery();

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      status: "success" as const,
      icon: Person,
    },
    {
      label: "Total Posts",
      value: stats?.totalPosts ?? 0,
      status: "success" as const,
      icon: FileText,
    },
    {
      label: "Total Comments",
      value: stats?.totalComments ?? 0,
      status: "success" as const,
      icon: Comment,
    },
    {
      label: "Total Views",
      value: stats?.totalViews ?? 0,
      status: "warning" as const,
      icon: Eye,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <KPI key={stat.label}>
          <KPI.Header className="flex-row items-center justify-between">
            <KPI.Title className="text-muted text-xs font-medium">{stat.label}</KPI.Title>
            <KPI.Icon status={stat.status} aria-hidden="true">
              <stat.icon />
            </KPI.Icon>
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

"use client";

import React from "react";
import { 
  AreaChart, 
  BarChart, 
  KPI, 
  KPIGroup, 
  Widget, 
  EmptyState, 
  Command 
} from "@heroui-pro/react";
import { Chip, Spinner } from "@heroui/react";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { 
  useGetDashboardStatsQuery, 
  useGetAnalyticsOverviewQuery 
} from "@/lib/features/dashboard";
import { 
  TargetIcon, 
  PersonsIcon, 
  FileTextIcon, 
  ClockIcon, 
  EyeIcon 
} from "@/components/icons";

export default function DashboardPage() {
  const isAdmin = useAppSelector(selectIsAdmin);

  const { 
    data: stats, 
    isLoading: isLoadingStats, 
    isError: isErrorStats 
  } = useGetDashboardStatsQuery(undefined, { skip: !isAdmin });
  
  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics, 
    isError: isErrorAnalytics 
  } = useGetAnalyticsOverviewQuery(undefined, { skip: !isAdmin });

  if (!isAdmin) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <TargetIcon className="text-danger" width={32} height={32} />
            </EmptyState.Media>
            <EmptyState.Title>Access Denied</EmptyState.Title>
            <EmptyState.Description>
              You must have administrator privileges to view the dashboard.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      </div>
    );
  }

  if (isLoadingStats || isLoadingAnalytics) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Spinner size="lg" color="current" />
      </div>
    );
  }

  if (isErrorStats || isErrorAnalytics) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <TargetIcon className="text-danger" width={32} height={32} />
            </EmptyState.Media>
            <EmptyState.Title>Failed to load data</EmptyState.Title>
            <EmptyState.Description>
              There was an error fetching the dashboard statistics. Please try again later.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      </div>
    );
  }

  // Fallback data for empty states
  const safeStats = stats || {
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalViews: 0,
  };

  const safeAnalytics = analytics || {
    todayPv: 0,
    yesterdayPv: 0,
    pvGrowthRate: 0,
    todayUv: 0,
    yesterdayUv: 0,
    topContent: [],
  };

  // Mock chart data based on API overview
  const pvChartData = [
    { date: "Yesterday", pv: safeAnalytics.yesterdayPv },
    { date: "Today", pv: safeAnalytics.todayPv },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of site-wide statistics and traffic.</p>
        </div>
      </div>

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Icon>
              <PersonsIcon width={18} height={18} />
            </KPI.Icon>
            <KPI.Title>Total Users</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={safeStats.totalUsers} />
          </KPI.Content>
        </KPI>

        <KPI>
          <KPI.Header>
            <KPI.Icon>
              <FileTextIcon width={18} height={18} />
            </KPI.Icon>
            <KPI.Title>Total Posts</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={safeStats.totalPosts} />
          </KPI.Content>
        </KPI>

        <KPI>
          <KPI.Header>
            <KPI.Icon>
              <ClockIcon width={18} height={18} />
            </KPI.Icon>
            <KPI.Title>Comments</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={safeStats.totalComments} />
          </KPI.Content>
        </KPI>

        <KPI>
          <KPI.Header>
            <KPI.Icon>
              <EyeIcon width={18} height={18} />
            </KPI.Icon>
            <KPI.Title>Total Views</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={safeStats.totalViews} />
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Widget>
          <Widget.Header>
            <Widget.Title>Page Views (PV)</Widget.Title>
            <Widget.Description>Comparison of today vs yesterday</Widget.Description>
          </Widget.Header>
          <Widget.Content className="h-72">
            <BarChart data={pvChartData} height={200}>
              <BarChart.Grid vertical={false} />
              <BarChart.XAxis dataKey="date" tickMargin={8} />
              <BarChart.YAxis width={40} />
              <BarChart.Bar
                barSize={16}
                dataKey="pv"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
              />
              <BarChart.Tooltip 
                content={
                  <BarChart.TooltipContent 
                    valueFormatter={(v) => `${Number(v).toLocaleString()}`} 
                  />
                } 
              />
            </BarChart>
          </Widget.Content>
          <Widget.Footer>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Growth Rate:</span>
              <Chip 
                size="sm" 
                color={safeAnalytics.pvGrowthRate >= 0 ? "success" : "danger"} 
                variant="soft"
              >
                {safeAnalytics.pvGrowthRate >= 0 ? "+" : ""}{safeAnalytics.pvGrowthRate.toFixed(2)}%
              </Chip>
            </div>
          </Widget.Footer>
        </Widget>

        <Widget>
          <Widget.Header>
            <Widget.Title>Traffic Trend</Widget.Title>
            <Widget.Description>Simulated daily unique visitors trend</Widget.Description>
          </Widget.Header>
          <Widget.Content className="h-72">
            <AreaChart
              data={[
                { date: "Yesterday", uv: safeAnalytics.yesterdayUv },
                { date: "Today", uv: safeAnalytics.todayUv },
              ]}
              height={200}
            >
              <AreaChart.Grid vertical={false} />
              <AreaChart.XAxis dataKey="date" tickMargin={8} />
              <AreaChart.YAxis width={40} />
              <AreaChart.Area
                dataKey="uv"
                fill="var(--accent)"
                fillOpacity={0.2}
                stroke="var(--accent)"
              />
              <AreaChart.Tooltip 
                content={
                  <AreaChart.TooltipContent 
                    valueFormatter={(v) => `${Number(v).toLocaleString()}`} 
                  />
                } 
              />
            </AreaChart>
          </Widget.Content>
        </Widget>
      </div>
    </div>
  );
}

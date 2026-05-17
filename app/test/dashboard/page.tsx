"use client";

import React from "react";
import { Card, Separator, Alert, Typography, Table, Chip } from "@heroui/react";
import { useGetDashboardStatsQuery, useGetAnalyticsOverviewQuery } from "@/lib/features/dashboard";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

function StatCard({
  title,
  value,
  description,
  color = "default",
}: {
  title: string;
  value: number | string;
  description?: string;
  color?: any;
}) {
  return (
    <Card className="p-4 border-none shadow-sm bg-default-50">
      <Card.Header className="pb-1 pt-0 px-0">
        <p className="text-[10px] font-black uppercase text-default-500 tracking-wider">{title}</p>
      </Card.Header>
      <div className="flex flex-col">
        <h2 className="text-2xl font-black">{value}</h2>
        {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
      </div>
    </Card>
  );
}

export default function DashboardTestPage() {
  const mounted = useMounted();
  const isAdmin = useAppSelector(selectIsAdmin);

  // Queries
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useGetDashboardStatsQuery(undefined, { skip: !isAdmin });
  const { data: analytics, isLoading: isAnalyticsLoading } = useGetAnalyticsOverviewQuery(
    undefined,
    { skip: !isAdmin }
  );

  if (!mounted) return null;

  const getErrorMessage = (error: any) => {
    return typeof error === "string" ? error : "An unexpected error occurred";
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <Typography type="h1" weight="bold">
          Admin Dashboard Test Page
        </Typography>
        <p className="text-muted-foreground text-sm">
          Testing real-time metrics and traffic analysis.
        </p>
      </header>

      {!isAdmin ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Access Denied</Alert.Title>
            <Alert.Description>
              Please login as an admin to view dashboard statistics.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Site-wide Overview */}
          <div className="flex flex-col gap-4">
            {statsError && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Stats Fetch Failed</Alert.Title>
                  <Alert.Description>{getErrorMessage(statsError)}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {isStatsLoading ? (
                <div className="col-span-full h-24 bg-default-100 animate-pulse rounded-xl" />
              ) : (
                <>
                  <StatCard title="Total Users" value={stats?.totalUsers ?? "-"} />
                  <StatCard title="Total Posts" value={stats?.totalPosts ?? "-"} />
                  <StatCard title="Total Comments" value={stats?.totalComments ?? "-"} />
                  <StatCard title="Pending Review" value={stats?.pendingComments ?? "-"} />
                  <StatCard title="Total Views" value={stats?.totalViews ?? "-"} />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Traffic Analytics */}
            <Card className="h-fit">
              <Card.Header>
                <Card.Title>Today's Traffic</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col gap-6">
                {analyticsError && (
                  <Alert status="danger" className="mb-2">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Analytics Failed</Alert.Title>
                      <Alert.Description>{getErrorMessage(analyticsError)}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}
                {isAnalyticsLoading ? (
                  <p>Loading analytics...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-[10px] font-bold text-primary uppercase">
                          Page Views (PV)
                        </p>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-black">{analytics?.todayPv}</span>
                          <span
                            className={`text-[10px] mb-1 font-bold ${analytics?.pvGrowthRate && analytics.pvGrowthRate >= 0 ? "text-success" : "text-danger"}`}
                          >
                            {analytics?.pvGrowthRate && analytics.pvGrowthRate >= 0 ? "↑" : "↓"}{" "}
                            {Math.abs(analytics?.pvGrowthRate || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                        <p className="text-[10px] font-bold text-secondary uppercase">
                          Unique Visitors (UV)
                        </p>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-black">{analytics?.todayUv}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold">Yesterday's Comparison</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Yesterday PV: {analytics?.yesterdayPv}</span>
                        <span>Yesterday UV: {analytics?.yesterdayUv}</span>
                      </div>
                    </div>
                  </>
                )}
              </Card.Content>
            </Card>

            {/* Top Content (Simplified for Test) */}
            <Card>
              <Card.Header>
                <Card.Title>Top Content</Card.Title>
              </Card.Header>
              <Card.Content>
                <Table aria-label="Top performing content">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column isRowHeader>PATH / TITLE</Table.Column>
                        <Table.Column>VIEWS</Table.Column>
                      </Table.Header>
                      <Table.Body renderEmptyState={() => "No traffic data yet."}>
                        {(analytics?.topContent || []).map((item: any, idx) => (
                          <Table.Row key={idx}>
                            <Table.Cell>
                              <div className="max-w-[200px] truncate text-xs font-mono">
                                {item.path || item.title || "Unknown"}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Chip size="sm" variant="flat" color="primary">
                                {item.count || item.views || 0}
                              </Chip>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              </Card.Content>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

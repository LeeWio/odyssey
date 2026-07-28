"use client";

import dynamic from "next/dynamic";
import { DashboardToolbar } from "../widgets/dashboard-toolbar";
import { KpiRow } from "../widgets/kpi-row";
import { Skeleton } from "@heroui/react";

// Dynamically import heavy chart/table widgets with skeletons
const SalesPerformanceCard = dynamic(
  () => import("../widgets/sales-performance-card").then((m) => m.SalesPerformanceCard),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-2xl" />,
  }
);
const TrafficSourceCard = dynamic(
  () => import("../widgets/traffic-source-card").then((m) => m.TrafficSourceCard),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-2xl" />,
  }
);
const MarketPulseCard = dynamic(
  () => import("../widgets/market-pulse-card").then((m) => m.MarketPulseCard),
  {
    loading: () => <Skeleton className="h-[200px] w-full rounded-2xl" />,
  }
);
const UsersTable = dynamic(() => import("../widgets/users-table").then((m) => m.UsersTable), {
  loading: () => <Skeleton className="h-[400px] w-full rounded-2xl" />,
});

export function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pt-8 pb-10">
      <DashboardToolbar />
      <KpiRow />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SalesPerformanceCard />
        <TrafficSourceCard />
      </div>
      <MarketPulseCard />
      <UsersTable />
    </div>
  );
}

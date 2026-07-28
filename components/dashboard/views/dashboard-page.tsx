"use client";

import { DashboardToolbar } from "../widgets/dashboard-toolbar";
import { KpiRow } from "../widgets/kpi-row";
import { MarketPulseCard } from "../widgets/market-pulse-card";
import { SalesPerformanceCard } from "../widgets/sales-performance-card";
import { TrafficSourceCard } from "../widgets/traffic-source-card";
import { UsersTable } from "../widgets/users-table";

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

"use client";

// Charts read /api/v1/admin/analytics/*. The range control is not wired yet:
// each card requests its own fixed window.

import { Chip } from "@heroui/react";

import { AnalyticsKpiRow } from "../widgets/analytics-kpi-row";
import { ContentFunnelCard } from "../widgets/content-funnel-card";
import { DeviceBreakdownCard } from "../widgets/device-breakdown-card";
import { SessionsOverTimeCard } from "../widgets/sessions-over-time-card";
import { TopChannelsCard } from "../widgets/top-channels-card";
import { TopPagesCard } from "../widgets/top-pages-card";

export function AnalyticsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-4 pb-10">
      <div className="flex flex-col gap-2">
        <Chip className="w-fit" size="sm" variant="soft">
          Admin analytics
        </Chip>
        <p className="text-muted text-sm">
          Sessions, devices, channels, top pages, and the content funnel come from the admin
          analytics API. Cards use a fixed 30-day window.
        </p>
      </div>

      <AnalyticsKpiRow />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <SessionsOverTimeCard />
        <ContentFunnelCard />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DeviceBreakdownCard />
        <TopChannelsCard />
      </div>

      <TopPagesCard />
    </div>
  );
}

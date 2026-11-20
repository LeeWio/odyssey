"use client";

import { Label, ListBox, Select } from "@heroui/react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { AnalyticsKpiRow } from "../widgets/analytics-kpi-row";
import { ContentFunnelCard } from "../widgets/content-funnel-card";
import { DeviceBreakdownCard } from "../widgets/device-breakdown-card";
import { SessionsOverTimeCard } from "../widgets/sessions-over-time-card";
import { TopChannelsCard } from "../widgets/top-channels-card";
import { TopPagesCard } from "../widgets/top-pages-card";
import { VisitorsCard } from "../widgets/visitors-card";

export function AnalyticsPage() {
  const t = useTranslations("Dashboard");
  const [days, setDays] = useState(30);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-4 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-foreground text-2xl font-semibold">{t("analytics.title")}</h1>
          <p className="text-muted max-w-3xl text-sm">{t("analytics.description")}</p>
          <p className="text-muted text-xs">{t("analytics.rangeHint")}</p>
        </div>
        <Select
          className="w-full shrink-0 sm:w-48"
          value={String(days)}
          onChange={(value) => {
            if (value) setDays(Number(value));
          }}
        >
          <Label>{t("analytics.range")}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="7" textValue={t("analytics.last7Days")}>
                {t("analytics.last7Days")}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="30" textValue={t("analytics.last30Days")}>
                {t("analytics.last30Days")}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="90" textValue={t("analytics.last90Days")}>
                {t("analytics.last90Days")}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="365" textValue={t("analytics.last365Days")}>
                {t("analytics.last365Days")}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <AnalyticsKpiRow days={days} />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <SessionsOverTimeCard days={days} />
        <ContentFunnelCard days={days} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DeviceBreakdownCard days={days} />
        <TopChannelsCard days={days} />
      </div>

      <TopPagesCard />
      <VisitorsCard days={days} />
    </div>
  );
}

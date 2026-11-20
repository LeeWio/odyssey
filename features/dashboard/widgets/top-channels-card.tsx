"use client";

import { Card } from "@heroui/react";
import { BarChart } from "@heroui-pro/react/bar-chart";
import { useTranslations } from "next-intl";

import { useGetTrafficAnalyticsQuery } from "@/lib/features/dashboard";

function formatThousands(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`;
}

export function TopChannelsCard({ days = 30 }: { days?: number }) {
  const t = useTranslations("Dashboard");
  const { data } = useGetTrafficAnalyticsQuery(days);
  const channels = (data?.sources ?? []).map((source) => ({
    channel: source.name,
    sessions: source.views,
  }));

  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title className="text-base">{t("widgets.topChannels")}</Card.Title>
        <Card.Description>{t("widgets.topChannelsDescription")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <BarChart data={channels} height={360} layout="vertical">
          <BarChart.Grid horizontal={false} />
          <BarChart.XAxis tickFormatter={formatThousands} tickMargin={4} type="number" />
          <BarChart.YAxis dataKey="channel" tickMargin={4} type="category" width={110} />
          <BarChart.Bar
            barSize={16}
            dataKey="sessions"
            fill="var(--chart-3)"
            name={t("widgets.sessions")}
            radius={[0, 24, 24, 0]}
          />
          <BarChart.Tooltip content={<BarChart.TooltipContent />} />
        </BarChart>
      </Card.Content>
    </Card>
  );
}

"use client";

import type { ReactNode } from "react";

import { Card } from "@heroui/react";
import { ChartTooltip } from "@heroui-pro/react";
import { PieChart } from "@heroui-pro/react/pie-chart";
import { useMemo } from "react";
import { Cell, Funnel, FunnelChart, ResponsiveContainer, Tooltip } from "recharts";
import { useSearchAdminPostsQuery, type PostStatus } from "@/lib/features/post";

const FORECAST_MIX = [
  { color: "var(--chart-1)", name: "Open pipeline", statuses: ["DRAFT", "PENDING_REVIEW"] },
  { color: "var(--chart-3)", name: "Best case", statuses: ["SCHEDULED"] },
  { color: "var(--chart-4)", name: "Commit", statuses: ["PUBLISHED"] },
] as const;

const PIPELINE_STAGES: { fill: string; status: PostStatus; stage: string }[] = [
  { fill: "var(--chart-5)", stage: "Draft", status: "DRAFT" },
  { fill: "var(--chart-4)", stage: "Review", status: "PENDING_REVIEW" },
  { fill: "var(--chart-3)", stage: "Scheduled", status: "SCHEDULED" },
  { fill: "var(--chart-2)", stage: "Published", status: "PUBLISHED" },
  { fill: "var(--chart-1)", stage: "Rejected", status: "REJECTED" },
  { fill: "var(--accent)", stage: "Archived", status: "ARCHIVED" },
];

interface StagePoint {
  count: number;
  fill: string;
  stage: string;
  value: number;
}

export function PipelineFunnelCard() {
  const { data } = useSearchAdminPostsQuery({ page: 0, size: 200 });
  const posts = useMemo(() => data?.list ?? [], [data]);
  const forecastMix = useMemo(
    () =>
      FORECAST_MIX.map((item) => ({
        color: item.color,
        name: item.name,
        value: posts
          .filter((post) => (item.statuses as readonly string[]).includes(post.status))
          .reduce((sum, post) => sum + post.views, 0),
      })),
    [posts]
  );
  const forecastTotal = forecastMix.reduce((sum, item) => sum + item.value, 0);
  const pipelineStages = useMemo<StagePoint[]>(
    () =>
      PIPELINE_STAGES.map((stage) => {
        const matches = posts.filter((post) => post.status === stage.status);

        return {
          count: matches.length,
          fill: stage.fill,
          stage: stage.stage,
          value: matches.reduce((sum, post) => sum + post.views, 0),
        };
      }),
    [posts]
  );
  const pipelineTotal = pipelineStages.reduce((sum, stage) => sum + stage.value, 0);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between gap-3">
          <Card.Title className="text-base">Weighted Forecast</Card.Title>
          <span className="text-sm font-semibold tabular-nums">{formatCount(forecastTotal)}</span>
        </Card.Header>
        <Card.Content className="flex flex-col items-center gap-4">
          <ClientChart height={220}>
            <PieChart height={220} width={220}>
              <PieChart.Pie
                cx="50%"
                cy="50%"
                data={forecastMix}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
              >
                {forecastMix.map((item) => (
                  <PieChart.Cell key={item.name} fill={item.color} />
                ))}
              </PieChart.Pie>
              <PieChart.Tooltip
                content={
                  <ChartTooltip.Content
                    hideHeader
                    valueFormatter={(value) => formatCount(Number(value))}
                  />
                }
              />
            </PieChart>
          </ClientChart>
          <div className="flex w-full max-w-sm flex-col gap-2.5">
            {forecastMix.map((item) => {
              const percent = forecastTotal ? Math.round((item.value / forecastTotal) * 100) : 0;

              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="min-w-0 flex-1 text-sm">{item.name}</span>
                  <span className="text-sm tabular-nums">{formatCount(item.value)}</span>
                  <span className="text-muted w-8 text-right text-xs tabular-nums">{percent}%</span>
                </div>
              );
            })}
          </div>
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Pipeline Funnel</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <ClientChart className="w-full" height={168}>
            <div aria-label="Pipeline funnel" className="relative h-[168px] w-full">
              <ResponsiveContainer height={168} width="100%">
                <FunnelChart layout="horizontal">
                  <Tooltip content={<StageTooltip />} />
                  <Funnel
                    data={pipelineStages}
                    dataKey="value"
                    isAnimationActive={false}
                    lastShapeType="rectangle"
                    nameKey="stage"
                    shape={HorizontalFunnelShape}
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {pipelineStages.map((item) => (
                      <Cell key={item.stage} fill={item.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </ClientChart>
          <div className="flex w-full flex-col gap-2.5">
            {pipelineStages.map((item) => {
              const percent = pipelineTotal ? Math.round((item.value / pipelineTotal) * 100) : 0;

              return (
                <div key={item.stage} className="flex items-center gap-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="min-w-0 flex-1 text-sm">{item.stage}</span>
                  <span className="text-sm tabular-nums">{formatCount(item.value)}</span>
                  <span className="text-muted w-8 text-right text-xs tabular-nums">{percent}%</span>
                </div>
              );
            })}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function ClientChart({
  children,
  className,
  height,
}: {
  children: ReactNode;
  className?: string;
  height: number;
}) {
  return (
    <div className={className} style={{ minHeight: height }}>
      {children}
    </div>
  );
}

function HorizontalFunnelShape({
  fill,
  height,
  lowerWidth,
  parentViewBox,
  stroke,
  strokeWidth = 2,
  upperWidth,
  y,
}: {
  fill?: string;
  height: number;
  lowerWidth: number;
  parentViewBox?: { height: number; width: number; x: number; y: number };
  stroke?: string;
  strokeWidth?: number | string;
  upperWidth: number;
  y: number;
}) {
  if (!parentViewBox || height <= 0 || parentViewBox.height <= 0) return null;

  const scale = parentViewBox.width / parentViewBox.height;
  const colWidth = height * scale;
  const hx = parentViewBox.x + (y - parentViewBox.y) * scale;
  const upperH = upperWidth * (parentViewBox.height / parentViewBox.width);
  const lowerH = lowerWidth * (parentViewBox.height / parentViewBox.width);
  const top = parentViewBox.y + (parentViewBox.height - upperH) / 2;
  const nextTop = parentViewBox.y + (parentViewBox.height - lowerH) / 2;
  const path = [
    `M ${hx},${top}`,
    `L ${hx + colWidth},${nextTop}`,
    `L ${hx + colWidth},${nextTop + lowerH}`,
    `L ${hx},${top + upperH}`,
    "Z",
  ].join(" ");

  return <path d={path} fill={fill} stroke={stroke} strokeWidth={Number(strokeWidth) || 2} />;
}

function StageTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    fill?: string;
    payload?: StagePoint;
    value?: number | string;
  }>;
}) {
  const entry = payload?.[0];

  if (!active || !entry) return null;

  const count = entry.payload?.count ?? 0;

  return (
    <ChartTooltip>
      <ChartTooltip.Header>{entry.payload?.stage}</ChartTooltip.Header>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color={entry.color ?? entry.payload?.fill ?? entry.fill} />
        <ChartTooltip.Label>{count === 1 ? "1 post" : `${count} posts`}</ChartTooltip.Label>
        <ChartTooltip.Value>{formatCount(Number(entry.value ?? 0))}</ChartTooltip.Value>
      </ChartTooltip.Item>
    </ChartTooltip>
  );
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

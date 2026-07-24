"use client";

import { Skeleton } from "@heroui/react";
import type { DataGridColumn } from "@heroui-pro/react";

import { DataGrid, NumberValue, TrendChip } from "@heroui-pro/react";
import { useMemo } from "react";
import type { TopPageResponse } from "@/lib/features/dashboard";

import { useGetTopPagesQuery } from "@/lib/features/dashboard";

export function TopPagesCard({ days }: { days?: number }) {
  const { data: topPages, isLoading } = useGetTopPagesQuery(days);

  const columns = useMemo<DataGridColumn<TopPageResponse>[]>(
    () => [
      {
        accessorKey: "path",
        allowsSorting: true,
        cell: (item) =>
          isLoading ? (
            <Skeleton className="h-4 w-3/4 rounded" />
          ) : (
            <span className="font-medium">{item.path}</span>
          ),
        header: "Path",
        id: "path",
        isRowHeader: true,
        minWidth: 220,
      },
      {
        accessorKey: "views",
        allowsSorting: true,
        cell: (item) =>
          isLoading ? (
            <Skeleton className="h-4 w-1/2 rounded" />
          ) : (
            <NumberValue className="tabular-nums" maximumFractionDigits={0} value={item.views} />
          ),
        header: "Views",
        id: "views",
        minWidth: 120,
      },
      {
        accessorKey: "avs.time",
        allowsSorting: true,
        cell: (item) =>
          isLoading ? (
            <Skeleton className="h-4 w-1/2 rounded" />
          ) : (
            <span className="text-muted tabular-nums">{item["avs.time"] ?? "-"}</span>
          ),
        header: "Avg. time",
        id: "avs.time",
        minWidth: 120,
      },
      {
        accessorKey: "bounce",
        allowsSorting: true,
        cell: (item) =>
          isLoading ? (
            <Skeleton className="h-4 w-1/2 rounded" />
          ) : (
            <NumberValue
              className="text-muted tabular-nums"
              maximumFractionDigits={1}
              style="percent"
              value={(item.bounce ?? 0) / 100}
            />
          ),
        header: "Bounce",
        id: "bounce",
        minWidth: 100,
      },
      {
        cell: (item) => {
          if (isLoading) {
            return <Skeleton className="h-6 w-16 rounded-full" />;
          }
          const trendValue = item.trend ?? "0%";
          const isUp = trendValue.startsWith("+");
          const isDown = trendValue.startsWith("-");
          const direction = isUp ? "up" : isDown ? "down" : "neutral";
          return <TrendChip trend={direction}>{trendValue.replace(/^[+-]/, "")}</TrendChip>;
        },
        header: "Trend",
        id: "trend",
        minWidth: 100,
      },
    ],
    [isLoading]
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-base font-semibold">Top pages</h2>
        <p className="text-muted text-xs">Most-viewed pages over the selected period.</p>
      </div>
      <DataGrid
        aria-label="Top pages"
        columns={columns}
        contentClassName="min-w-[640px]"
        data={topPages ?? []}
        getRowId={(item) => item.path}
      />
    </section>
  );
}

"use client";

import type { DataGridColumn } from "@heroui-pro/react";

import { DataGrid, NumberValue, TrendChip } from "@heroui-pro/react";
import { useMemo } from "react";
import { useGetTopPagesQuery, type TopPageResponse } from "@/lib/features/dashboard";

type PageRow = TopPageResponse & { id: string; trendDirection: "up" | "down" | "neutral" };

export function TopPagesCard() {
  const { data: pages = [] } = useGetTopPagesQuery();
  const rows = useMemo<PageRow[]>(
    () =>
      pages.map((page) => {
        const trend = page.trend ?? "0%";

        return {
          ...page,
          id: page.path,
          trendDirection: trend.startsWith("+") ? "up" : trend.startsWith("-") ? "down" : "neutral",
        };
      }),
    [pages]
  );
  const columns = useMemo<DataGridColumn<PageRow>[]>(
    () => [
      {
        accessorKey: "path",
        allowsSorting: true,
        cell: (item) => <span className="font-medium">{item.path}</span>,
        header: "Path",
        id: "path",
        isRowHeader: true,
        minWidth: 220,
      },
      {
        accessorKey: "views",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue className="tabular-nums" maximumFractionDigits={0} value={item.views} />
        ),
        header: "Views",
        id: "views",
        minWidth: 120,
      },
      {
        accessorKey: "avs.time",
        allowsSorting: true,
        cell: (item) => <span className="text-muted tabular-nums">{item["avs.time"] ?? "-"}</span>,
        header: "Avg. time",
        id: "avs.time",
        minWidth: 120,
      },
      {
        accessorKey: "bounce",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className="text-muted tabular-nums"
            maximumFractionDigits={1}
            style="percent"
            value={item.bounce / 100}
          />
        ),
        header: "Bounce",
        id: "bounce",
        minWidth: 100,
      },
      {
        cell: (item) => (
          <TrendChip trend={item.trendDirection}>
            {(item.trend ?? "0%").replace(/^[+-]/, "")}
          </TrendChip>
        ),
        header: "Trend",
        id: "trend",
        minWidth: 100,
      },
    ],
    []
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
        data={rows}
        getRowId={(item) => item.id}
      />
    </section>
  );
}

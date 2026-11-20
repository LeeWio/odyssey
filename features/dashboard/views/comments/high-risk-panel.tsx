"use client";

import { Button, Chip } from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { useMemo, useState } from "react";

import { type CommentRiskResponse, useGetHighRiskCommentsQuery } from "@/lib/features/comment";
import { CommentStatusChip } from "./status-chip";

export function CommentHighRiskPanel() {
  const [page, setPage] = useState(0);
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "riskScore",
    direction: "descending",
  });

  const { data, isLoading, isFetching } = useGetHighRiskCommentsQuery({
    page,
    size: 20,
    minOpenReports: 1,
  });
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const rows = useMemo(() => {
    const list = data?.list ?? [];
    const col = sortDescriptor.column as keyof CommentRiskResponse;
    return [...list].sort((a, b) => {
      const first = a[col] ?? 0;
      const second = b[col] ?? 0;
      const cmp =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second));
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [data?.list, sortDescriptor]);

  const columns = useMemo<DataGridColumn<CommentRiskResponse>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        id: "id",
        minWidth: 72,
        isRowHeader: true,
        cell: (item) => <span className="tabular-nums">{item.id}</span>,
      },
      {
        accessorKey: "username",
        header: "User",
        id: "username",
        minWidth: 120,
      },
      {
        accessorKey: "content",
        header: "Content",
        id: "content",
        minWidth: 260,
        cell: (item) => <span className="line-clamp-2 text-sm">{item.content || "—"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        id: "status",
        minWidth: 110,
        cell: (item) => <CommentStatusChip status={item.status} />,
      },
      {
        accessorKey: "openReports",
        allowsSorting: true,
        header: "Open reports",
        id: "openReports",
        minWidth: 120,
        cell: (item) => (
          <Chip size="sm" variant="soft" color="danger">
            {item.openReports ?? 0}
          </Chip>
        ),
      },
      {
        accessorKey: "riskScore",
        allowsSorting: true,
        header: "Risk",
        id: "riskScore",
        minWidth: 90,
        cell: (item) => <span className="font-semibold tabular-nums">{item.riskScore ?? 0}</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        id: "createdAt",
        minWidth: 160,
        cell: (item) => (
          <span className="text-muted text-sm tabular-nums">
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted text-sm">
          Comments with open reports and elevated risk scores. Use Moderation to approve, reject, or
          pin after review.
        </p>
        <Chip size="sm" variant="soft">
          page {page + 1}/{totalPages}
        </Chip>
      </div>
      <div className="bg-surface border-border overflow-hidden rounded-2xl border">
        <DataGrid
          aria-label="High-risk comments"
          columns={columns}
          contentClassName="min-w-[960px]"
          data={rows}
          getRowId={(item) => item.id}
          isLoadingMore={isLoading || isFetching}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={page <= 0}
          onPress={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={page + 1 >= totalPages}
          onPress={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

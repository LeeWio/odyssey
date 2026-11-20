"use client";

import { Button, Chip, Label, ListBox, Select } from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { useMemo, useState } from "react";

import {
  type CommentReportResponse,
  type CommentReportStatus,
  useGetCommentReportsQuery,
  useResolveCommentReportMutation,
} from "@/lib/features/comment";
import { CommentStatusChip } from "./status-chip";

type ReportStatusFilter = "all" | CommentReportStatus;

const REPORT_STATUS_COLOR: Record<
  CommentReportStatus,
  "success" | "warning" | "danger" | "default"
> = {
  OPEN: "danger",
  ACTIONED: "success",
  DISMISSED: "default",
};

export function CommentReportsPanel() {
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>("OPEN");
  const [page, setPage] = useState(0);
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  const { data, isLoading, isFetching } = useGetCommentReportsQuery({
    page,
    size: 20,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const [resolveReport, { isLoading: isResolving }] = useResolveCommentReportMutation();

  const rows = useMemo(() => {
    const list = data?.list ?? [];
    const col = sortDescriptor.column as keyof CommentReportResponse;
    return [...list].sort((a, b) => {
      const first = a[col] ?? "";
      const second = b[col] ?? "";
      const cmp = String(first).localeCompare(String(second));
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [data?.list, sortDescriptor]);

  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const columns = useMemo<DataGridColumn<CommentReportResponse>[]>(
    () => [
      {
        accessorKey: "commentId",
        header: "Comment",
        id: "commentId",
        minWidth: 90,
        isRowHeader: true,
        cell: (item) => <span className="tabular-nums">#{item.commentId ?? "—"}</span>,
      },
      {
        accessorKey: "reason",
        header: "Reason",
        id: "reason",
        minWidth: 120,
        cell: (item) => <span className="text-sm capitalize">{item.reason || "—"}</span>,
      },
      {
        accessorKey: "commentContent",
        header: "Content",
        id: "commentContent",
        minWidth: 220,
        cell: (item) => <span className="line-clamp-2 text-sm">{item.commentContent || "—"}</span>,
      },
      {
        accessorKey: "reporterUsername",
        header: "Reporter",
        id: "reporterUsername",
        minWidth: 120,
        cell: (item) => <span className="text-sm">{item.reporterUsername || "—"}</span>,
      },
      {
        accessorKey: "status",
        header: "Report",
        id: "status",
        minWidth: 110,
        cell: (item) =>
          item.status ? (
            <Chip size="sm" variant="soft" color={REPORT_STATUS_COLOR[item.status]}>
              {item.status}
            </Chip>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "commentStatus",
        header: "Comment status",
        id: "commentStatus",
        minWidth: 120,
        cell: (item) => <CommentStatusChip status={item.commentStatus} />,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        header: "Reported",
        id: "createdAt",
        minWidth: 160,
        cell: (item) => (
          <span className="text-muted text-sm tabular-nums">
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
          </span>
        ),
      },
      {
        align: "end",
        header: "Actions",
        id: "actions",
        minWidth: 200,
        cell: (item) =>
          item.status === "OPEN" && item.commentId != null && item.reporterId != null ? (
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                variant="secondary"
                isPending={isResolving}
                onPress={() =>
                  void resolveReport({
                    commentId: item.commentId!,
                    reporterId: item.reporterId!,
                    status: "DISMISSED",
                  })
                }
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                variant="primary"
                isPending={isResolving}
                onPress={() =>
                  void resolveReport({
                    commentId: item.commentId!,
                    reporterId: item.reporterId!,
                    status: "ACTIONED",
                  })
                }
              >
                Actioned
              </Button>
            </div>
          ) : (
            <span className="text-muted text-xs">
              {item.handledBy ? `by ${item.handledBy}` : "—"}
            </span>
          ),
      },
    ],
    [isResolving, resolveReport]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select
          className="w-full sm:w-[200px]"
          value={statusFilter}
          onChange={(value) => {
            setPage(0);
            setStatusFilter((value as ReportStatusFilter) || "OPEN");
          }}
        >
          <Label>Report status</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {(
                [
                  ["OPEN", "Open"],
                  ["ACTIONED", "Actioned"],
                  ["DISMISSED", "Dismissed"],
                  ["all", "All"],
                ] as const
              ).map(([id, label]) => (
                <ListBox.Item key={id} id={id} textValue={label}>
                  {label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <Chip size="sm" variant="soft">
          {data?.total ?? rows.length} reports · page {page + 1}/{totalPages}
        </Chip>
      </div>

      <div className="bg-surface border-border overflow-hidden rounded-2xl border">
        <DataGrid
          aria-label="Comment reports"
          columns={columns}
          contentClassName="min-w-[1100px]"
          data={rows}
          getRowId={(item) =>
            `${item.commentId ?? "c"}-${item.reporterId ?? "r"}-${item.createdAt ?? ""}-${item.reason ?? ""}`
          }
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

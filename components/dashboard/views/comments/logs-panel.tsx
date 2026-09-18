"use client";

import { Button, Chip, Label, ListBox, Select } from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { useMemo, useState } from "react";

import {
  type CommentModerationAction,
  type CommentModerationLogResponse,
  useGetCommentModerationLogsQuery,
} from "@/lib/features/comment";
import { CommentStatusChip } from "./status-chip";

type ActionFilter = "all" | CommentModerationAction;

export function CommentLogsPanel() {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [page, setPage] = useState(0);
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  const { data, isLoading, isFetching } = useGetCommentModerationLogsQuery({
    page,
    size: 20,
    action: actionFilter === "all" ? undefined : actionFilter,
  });
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const rows = useMemo(() => {
    const list = data?.list ?? [];
    const col = sortDescriptor.column as keyof CommentModerationLogResponse;
    return [...list].sort((a, b) => {
      const first = a[col] ?? "";
      const second = b[col] ?? "";
      const cmp = String(first).localeCompare(String(second));
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [data?.list, sortDescriptor]);

  const columns = useMemo<DataGridColumn<CommentModerationLogResponse>[]>(
    () => [
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        header: "When",
        id: "createdAt",
        minWidth: 160,
        isRowHeader: true,
        cell: (item) => (
          <span className="text-muted text-sm tabular-nums">
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
          </span>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        id: "action",
        minWidth: 140,
        cell: (item) =>
          item.action ? (
            <Chip size="sm" variant="soft">
              {item.action}
            </Chip>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "commentId",
        header: "Comment",
        id: "commentId",
        minWidth: 90,
        cell: (item) => <span className="tabular-nums">#{item.commentId ?? "—"}</span>,
      },
      {
        accessorKey: "commentContent",
        header: "Content",
        id: "commentContent",
        minWidth: 220,
        cell: (item) => <span className="line-clamp-2 text-sm">{item.commentContent || "—"}</span>,
      },
      {
        header: "Status change",
        id: "statusChange",
        minWidth: 180,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <CommentStatusChip status={item.previousStatus} />
            <span className="text-muted text-xs">→</span>
            <CommentStatusChip status={item.newStatus} />
          </div>
        ),
      },
      {
        accessorKey: "moderatorUsername",
        header: "Moderator",
        id: "moderatorUsername",
        minWidth: 120,
        cell: (item) => <span className="text-sm">{item.moderatorUsername || "system"}</span>,
      },
      {
        accessorKey: "note",
        header: "Note",
        id: "note",
        minWidth: 160,
        cell: (item) => (
          <span className="text-muted line-clamp-2 text-sm">{item.note || item.reason || "—"}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select
          className="w-full sm:w-[220px]"
          value={actionFilter}
          onChange={(value) => {
            setPage(0);
            setActionFilter((value as ActionFilter) || "all");
          }}
        >
          <Label>Action</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {(
                [
                  ["all", "All actions"],
                  ["SUBMITTED", "Submitted"],
                  ["EDITED", "Edited"],
                  ["STATUS_CHANGED", "Status changed"],
                  ["AUTO_FLAGGED", "Auto-flagged"],
                  ["DELETED", "Deleted"],
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
          {data?.total ?? rows.length} events · page {page + 1}/{totalPages}
        </Chip>
      </div>

      <div className="bg-surface border-border overflow-hidden rounded-2xl border">
        <DataGrid
          aria-label="Comment moderation logs"
          columns={columns}
          contentClassName="min-w-[1100px]"
          data={rows}
          getRowId={(item) =>
            `${item.id ?? "log"}-${item.commentId ?? "c"}-${item.createdAt ?? ""}-${item.action ?? ""}`
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

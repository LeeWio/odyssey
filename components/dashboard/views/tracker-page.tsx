"use client";

import {
  ArrowRight,
  ArrowRotateLeft,
  CircleCheck,
  CircleDashed,
  CirclePlay,
  Copy,
  Pencil,
  Plus,
  Stopwatch,
  TrashBin,
} from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import { Avatar, Button, Chip, Header, Label, ProgressBar, Skeleton, toast } from "@heroui/react";
import type { UseKanbanReturn } from "@heroui-pro/react";
import { ContextMenu, Kanban, KPI, KPIGroup, useKanban } from "@heroui-pro/react";
import type { ComponentType } from "react";
import { Fragment, useMemo, useState } from "react";
import type { KanbanColumn, KanbanTask } from "@/lib/features/kanban";
import {
  useDeleteKanbanTaskMutation,
  useDuplicateKanbanTaskMutation,
  useGetKanbanBoardQuery,
  useRelocateKanbanTaskMutation,
  useUpdateKanbanTaskMutation,
} from "@/lib/features/kanban";
import { IconButton } from "../icon-button";
import { usePersistentKanbanColumn } from "../use-persistent-kanban-column";
import { TrackerTaskDialog } from "./tracker-task-dialog";

type TrackerStatus = string;
export type TrackerTask = {
  id: string;
  title: string;
  description: string;
  status: TrackerStatus;
  tag: { color: "accent" | "success" | "warning" | "danger"; label: string };
  assignees: Array<{ avatar: string; name: string }>;
  dueDate?: string;
  subtasks?: { completed: number; total: number };
  source: KanbanTask;
};

const COLUMN_META: Record<
  "Done" | "In Progress" | "To Do",
  { indicator: string; icon: ComponentType<{ className?: string }> }
> = {
  Done: { icon: CircleCheck, indicator: "bg-success" },
  "In Progress": { icon: CirclePlay, indicator: "bg-warning" },
  "To Do": { icon: CircleDashed, indicator: "bg-accent" },
};

const KPI_META: Record<
  TrackerStatus,
  {
    icon: ComponentType<{ className?: string }>;
    label: string;
    status: "success" | "warning" | "danger";
  }
> = {
  Done: { icon: CircleCheck, label: "Completed", status: "success" },
  "In Progress": { icon: CirclePlay, label: "In Progress", status: "warning" },
  "To Do": { icon: CircleDashed, label: "To Do", status: "danger" },
};

function getTaskColumn(task: TrackerTask) {
  return task.status;
}

function setTaskColumn(task: TrackerTask, column: string) {
  return { ...task, status: column };
}

export function TrackerPage() {
  const board = useGetKanbanBoardQuery();

  if (board.isLoading) return <TrackerLoading />;
  if (board.isError) return <TrackerError onRetry={() => board.refetch()} />;
  if (!board.data) return null;

  return (
    <LiveTrackerBoard
      key={board.data.map((column) => column.updatedAt).join("|")}
      board={board.data}
      onRefresh={() => board.refetch()}
    />
  );
}

function LiveTrackerBoard({ board, onRefresh }: { board: KanbanColumn[]; onRefresh: () => void }) {
  const columns = board.map((column) => column.name);
  const tasks = board.flatMap((column) =>
    column.items.map((task) => toTrackerTask(task, column.name))
  );
  const kanban = useKanban<TrackerTask>({
    getColumn: getTaskColumn,
    initialItems: tasks,
    setColumn: setTaskColumn,
  });
  const [relocateTask] = useRelocateKanbanTaskMutation();
  const [duplicateTask] = useDuplicateKanbanTaskMutation();
  const [deleteTask] = useDeleteKanbanTaskMutation();
  const [updateTask] = useUpdateKanbanTaskMutation();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const moveTask = async (taskId: string, targetColumn: string) => {
    const targetColumnId = board.find((column) => column.name === targetColumn)?.id;
    if (!targetColumnId) return;
    const targetOrderIndex = kanban.list.items.filter(
      (item) => item.status === targetColumn
    ).length;
    kanban.moveItem(taskId, targetColumn);
    try {
      await relocateTask({ itemId: Number(taskId), targetColumnId, targetOrderIndex }).unwrap();
    } catch {
      toast.danger("Couldn't move this task. The board has been restored.");
      onRefresh();
    }
  };

  const persistDraggedTasks = (taskIds: string[]) => {
    void Promise.all(
      taskIds.map(async (taskId) => {
        const task = kanban.list.getItem(taskId);
        const targetColumnId = board.find((column) => column.name === task?.status)?.id;
        if (!task || !targetColumnId) return;
        const targetOrderIndex = kanban.list.items
          .filter((item) => item.status === task.status)
          .findIndex((item) => item.id === taskId);
        await relocateTask({ itemId: Number(taskId), targetColumnId, targetOrderIndex }).unwrap();
      })
    ).catch(() => {
      toast.danger("Couldn't save the new task order. The board has been restored.");
      onRefresh();
    });
  };

  const selectedTask = selectedTaskId ? (kanban.list.getItem(selectedTaskId) ?? null) : null;

  // Counts derived from the live kanban list so KPIs update as cards are
  // dragged (`rerender-derived-state-no-effect`).
  const counts = useMemo(() => {
    const base = Object.fromEntries(columns.map((column) => [column, 0])) as Record<string, number>;

    for (const item of kanban.list.items) {
      base[item.status] = (base[item.status] ?? 0) + 1;
    }

    return base;
  }, [columns, kanban.list.items]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <p className="text-muted text-sm">Track work across your team.</p>

      <KPIGroup>
        {columns.map((column, index) => {
          const meta = KPI_META[column as keyof typeof KPI_META] ?? KPI_META["To Do"];
          const Icon = meta.icon;

          return (
            <Fragment key={column}>
              {index > 0 ? <KPIGroup.Separator /> : null}
              <KPI>
                <KPI.Header>
                  <KPI.Icon status={meta.status}>
                    <Icon />
                  </KPI.Icon>
                  <KPI.Title>{meta.label}</KPI.Title>
                </KPI.Header>
                <KPI.Content>
                  <KPI.Value maximumFractionDigits={0} value={counts[column]} />
                </KPI.Content>
              </KPI>
            </Fragment>
          );
        })}
      </KPIGroup>

      <Kanban>
        {columns.map((column) => (
          <TrackerColumn
            key={column}
            column={column}
            kanban={kanban}
            onMove={moveTask}
            onPersist={persistDraggedTasks}
            onDuplicate={async (id) => {
              try {
                await duplicateTask(Number(id)).unwrap();
                toast.success("Task duplicated.");
                onRefresh();
              } catch {
                toast.danger("Couldn't duplicate this task.");
              }
            }}
            onDelete={async (id) => {
              kanban.removeItem(id);
              try {
                await deleteTask(Number(id)).unwrap();
              } catch {
                toast.danger("Couldn't delete this task. The board has been restored.");
                onRefresh();
              }
            }}
            onEdit={(id) => setSelectedTaskId(id)}
          />
        ))}
      </Kanban>
      <TrackerTaskDialog
        key={selectedTask?.id ?? "tracker-task-dialog"}
        columns={board}
        isOpen={selectedTask !== null}
        task={selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
        onSave={async (task, body) => {
          await updateTask({ id: Number(task.id), body }).unwrap();
          onRefresh();
          toast.success("Task updated.");
        }}
      />
    </div>
  );
}

interface TrackerColumnProps {
  column: string;
  kanban: UseKanbanReturn<TrackerTask>;
  onMove: (taskId: string, targetColumn: string) => Promise<void>;
  onPersist: (taskIds: string[]) => void;
  onDuplicate: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
}

function TrackerColumn({
  column,
  kanban,
  onMove,
  onPersist,
  onDuplicate,
  onDelete,
  onEdit,
}: TrackerColumnProps) {
  const { dragAndDropHooks, items } = usePersistentKanbanColumn(kanban, column, onPersist);
  const meta = COLUMN_META[column as keyof typeof COLUMN_META] ?? COLUMN_META["To Do"];

  return (
    <Kanban.Column>
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator className={meta.indicator} />
        <Kanban.ColumnTitle>{column}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{items.length}</Kanban.ColumnCount>
        <Kanban.ColumnActions>
          <IconButton label={`Add ${column} task`} size="sm" variant="ghost">
            <Plus className="size-4" />
          </IconButton>
        </Kanban.ColumnActions>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody>
        <Kanban.CardList
          aria-label={column}
          dragAndDropHooks={dragAndDropHooks}
          items={items}
          renderEmptyState={() => <span className="text-muted text-xs">Drop tasks here</span>}
        >
          {(task) => (
            <Kanban.Card textValue={task.title}>
              <TrackerCardContextMenu
                column={column}
                kanban={kanban}
                taskId={task.id}
                onMove={onMove}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onEdit={onEdit}
              >
                <TrackerCardContent task={task} />
              </TrackerCardContextMenu>
            </Kanban.Card>
          )}
        </Kanban.CardList>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
}

interface TrackerCardContextMenuProps {
  children: React.ReactNode;
  column: string;
  kanban: UseKanbanReturn<TrackerTask>;
  onMove: (taskId: string, targetColumn: string) => Promise<void>;
  onDuplicate: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
  taskId: string;
}

function TrackerCardContextMenu({
  children,
  column,
  kanban,
  taskId,
  onMove,
  onDuplicate,
  onDelete,
  onEdit,
}: TrackerCardContextMenuProps) {
  const otherColumns = Array.from(new Set(kanban.list.items.map((item) => item.status))).filter(
    (status) => status !== column
  );

  return (
    <ContextMenu>
      <ContextMenu.Trigger className="flex flex-col gap-[inherit]">{children}</ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu>
          <ContextMenu.Section>
            <Header>Actions</Header>
            <ContextMenu.Item textValue="Edit" onAction={() => onEdit(taskId)}>
              <Pencil />
              <Label>Edit</Label>
            </ContextMenu.Item>
            <ContextMenu.Item textValue="Duplicate" onAction={() => void onDuplicate(taskId)}>
              <Copy />
              <Label>Duplicate</Label>
            </ContextMenu.Item>
          </ContextMenu.Section>
          <ContextMenu.Separator />
          <ContextMenu.Section>
            <Header>Move to</Header>
            {otherColumns.map((col) => (
              <ContextMenu.Item
                key={col}
                textValue={`Move to ${col}`}
                onAction={() => void onMove(taskId, col)}
              >
                <ArrowRight />
                <Label>{col}</Label>
              </ContextMenu.Item>
            ))}
          </ContextMenu.Section>
          <ContextMenu.Separator />
          <ContextMenu.Section>
            <ContextMenu.Item textValue="Delete" onAction={() => void onDelete(taskId)}>
              <TrashBin />
              <Label className="text-danger">Delete</Label>
            </ContextMenu.Item>
          </ContextMenu.Section>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
}

function TrackerCardContent({ task }: { task: TrackerTask }) {
  const isDone = task.status === "Done";

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <Chip color={task.tag.color} size="sm" variant="soft">
          {task.tag.label}
        </Chip>
        {task.dueDate ? (
          <span className="text-muted inline-flex items-center gap-1 text-xs tabular-nums">
            <Stopwatch className="size-3" />
            {task.dueDate}
          </span>
        ) : null}
      </div>

      <span
        className={`text-foreground text-sm leading-snug font-medium ${
          isDone ? "line-through opacity-60" : ""
        }`}
      >
        {task.title}
      </span>

      {task.description ? (
        <span className="text-muted text-xs leading-snug">{task.description}</span>
      ) : null}

      {task.subtasks ? (
        <div className="flex items-center gap-2">
          <ProgressBar
            aria-label="Subtasks"
            className="flex-1"
            color="accent"
            size="sm"
            value={(task.subtasks.completed / task.subtasks.total) * 100}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <span className="text-muted text-xs tabular-nums">
            {task.subtasks.completed}/{task.subtasks.total}
          </span>
        </div>
      ) : null}

      <div className="mt-0.5 flex -space-x-2">
        {task.assignees.slice(0, 3).map((assignee) => (
          <Avatar key={assignee.name} className="ring-background size-5 ring-2" size="sm">
            <Avatar.Image alt={assignee.name} src={assignee.avatar} />
            <Avatar.Fallback>
              {assignee.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </Avatar.Fallback>
          </Avatar>
        ))}
        {task.assignees.length > 3 ? (
          <Avatar className="ring-background size-5 ring-2" size="sm">
            <Avatar.Fallback className="text-xs">+{task.assignees.length - 3}</Avatar.Fallback>
          </Avatar>
        ) : null}
      </div>
    </div>
  );
}

function toTrackerTask(task: KanbanTask, status: string): TrackerTask {
  const primaryTag = task.tags[0];
  const priorityTag = {
    HIGH: { color: "danger" as const, label: "High" },
    LOW: { color: "success" as const, label: "Low" },
    MEDIUM: { color: "warning" as const, label: "Medium" },
  }[task.priority];
  const completed = task.checklistItems.filter((item) => item.completed).length;

  return {
    assignees: task.assignees.map((assignee) => ({
      avatar: assignee.avatar ?? "",
      name: assignee.nickname || assignee.username,
    })),
    description: task.content ?? "",
    dueDate: task.reminderAt
      ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
          new Date(task.reminderAt)
        )
      : undefined,
    id: String(task.id),
    status,
    subtasks: task.checklistItems.length
      ? { completed, total: task.checklistItems.length }
      : undefined,
    tag: primaryTag ? { color: "accent", label: primaryTag.name } : priorityTag,
    title: task.title,
    source: task,
  };
}

function TrackerLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <Skeleton className="h-5 w-52 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function TrackerError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-7xl px-5 pt-8 pb-10">
      <EmptyState className="bg-surface-secondary w-full rounded-2xl">
        <EmptyState.Header>
          <EmptyState.Title>Tracker is unavailable</EmptyState.Title>
          <EmptyState.Description>Try loading the board again in a moment.</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button variant="outline" onPress={onRetry}>
            <ArrowRotateLeft aria-hidden="true" className="size-4" /> Refresh
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  );
}

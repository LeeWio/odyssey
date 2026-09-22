"use client";

// TODO: Replace the static `TRACKER_TASKS` (src/data/tracker.ts) with a live
// task store (InstantDB, Drizzle, your own API, etc.). `useKanban` drives
// optimistic DnD locally — persist the reordered column in your
// `onReorder`/`onInsert` handlers once you're wired up to a backend.

import type { UseKanbanReturn } from "@heroui-pro/react";
import type { ComponentType } from "react";

import {
  ArrowRight,
  ArrowsRotateLeft,
  CircleCheck,
  CircleDashed,
  CirclePlay,
  Copy,
  Pencil,
  Plus,
  Stopwatch,
  TrashBin,
} from "@gravity-ui/icons";
import { Avatar, Button, Chip, Header, Label, ProgressBar, Skeleton, toast } from "@heroui/react";
import {
  ContextMenu,
  EmptyState,
  KPIGroup,
  Kanban,
  useKanban,
  useKanbanCardPlaceholder,
} from "@heroui-pro/react";
import { KPI } from "@heroui-pro/react/kpi";
import { Fragment, useMemo, useState } from "react";
import type { KanbanColumn, KanbanTask } from "@/lib/features/kanban";
import {
  useCreateKanbanTaskMutation,
  useDeleteKanbanTaskMutation,
  useDuplicateKanbanTaskMutation,
  useGetKanbanBoardQuery,
  useRelocateKanbanTaskMutation,
  useUpdateKanbanTaskMutation,
} from "@/lib/features/kanban";

import { IconButton } from "../icon-button";
import { usePersistentKanbanColumn } from "../use-persistent-kanban-column";
import { useSheetPortal } from "../use-sheet-portal";
import { TRACKER_COLUMNS, type TrackerStatus, type TrackerTask } from "../data/tracker";
import { TrackerTaskDialog } from "./tracker-task-dialog";

export type { TrackerTask };

const COLUMN_META: Record<
  TrackerStatus,
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

function getTaskColumn(task: LiveTrackerTask): string {
  return task.status;
}

function setTaskColumn(task: LiveTrackerTask, column: string): LiveTrackerTask {
  return { ...task, status: column as TrackerStatus };
}

const PRIORITY_COLOR = {
  HIGH: "danger",
  LOW: "success",
  MEDIUM: "warning",
} as const;

function toTrackerTask(task: KanbanTask, status: string): LiveTrackerTask {
  const completed = task.checklistItems.filter((item) => item.completed).length;

  return {
    assignees: task.assignees.map((assignee) => ({
      avatar: assignee.avatar ?? "",
      name: assignee.nickname || assignee.username,
    })),
    description: task.content ?? "",
    dueDate: task.reminderAt
      ? new Date(task.reminderAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })
      : undefined,
    id: String(task.id),
    source: task,
    status: TRACKER_COLUMNS.find((column) => column === status) ?? "To Do",
    subtasks: task.checklistItems.length
      ? { completed, total: task.checklistItems.length }
      : undefined,
    tag: {
      color: PRIORITY_COLOR[task.priority],
      label: task.tags[0]?.name ?? task.epic,
    },
    title: task.title,
  };
}

export type LiveTrackerTask = TrackerTask & { source: KanbanTask };

export function TrackerPage() {
  const board = useGetKanbanBoardQuery();

  if (board.isLoading) return <TrackerLoading />;
  if (board.isError) return <TrackerError onRetry={() => board.refetch()} />;
  if (!board.data) return null;
  if (board.data.length === 0) return <TrackerEmpty onRetry={() => board.refetch()} />;

  return (
    <LiveTrackerBoard
      key={board.data.map((column) => column.updatedAt).join("|")}
      board={board.data}
      onRefresh={() => board.refetch()}
    />
  );
}

function LiveTrackerBoard({ board, onRefresh }: { board: KanbanColumn[]; onRefresh: () => void }) {
  const tasks = useMemo(
    () => board.flatMap((column) => column.items.map((task) => toTrackerTask(task, column.name))),
    [board]
  );
  const kanban = useKanban<LiveTrackerTask>({
    getColumn: getTaskColumn,
    initialItems: tasks,
    setColumn: setTaskColumn,
  });
  const [relocateTask] = useRelocateKanbanTaskMutation();
  const [duplicateTask] = useDuplicateKanbanTaskMutation();
  const [deleteTask] = useDeleteKanbanTaskMutation();
  const [updateTask] = useUpdateKanbanTaskMutation();
  const [createTask] = useCreateKanbanTaskMutation();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskColumnId, setNewTaskColumnId] = useState<number | null>(null);

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
    const base: Record<TrackerStatus, number> = { Done: 0, "In Progress": 0, "To Do": 0 };

    for (const item of kanban.list.items) {
      base[item.status] += 1;
    }

    return base;
  }, [kanban.list.items]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-4 pb-10">
      <p className="text-muted text-sm">Track work across your team.</p>

      <KPIGroup>
        {TRACKER_COLUMNS.map((column, index) => {
          const meta = KPI_META[column];
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
        {TRACKER_COLUMNS.map((column) => (
          <TrackerColumn
            key={column}
            column={column}
            kanban={kanban}
            onAdd={() => {
              const targetColumn = board.find((item) => item.name === column);
              if (targetColumn) setNewTaskColumnId(targetColumn.id);
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
            onDuplicate={async (id) => {
              try {
                await duplicateTask(Number(id)).unwrap();
                toast.success("Task duplicated.");
                onRefresh();
              } catch {
                toast.danger("Couldn't duplicate this task.");
              }
            }}
            onEdit={(id) => setSelectedTaskId(id)}
            onMove={moveTask}
            onPersist={persistDraggedTasks}
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
      <TrackerTaskDialog
        key={newTaskColumnId ? `new-${newTaskColumnId}` : "new-tracker-task-dialog"}
        columns={board}
        initialColumnId={newTaskColumnId}
        isOpen={newTaskColumnId !== null}
        task={null}
        onCreate={async (body) => {
          await createTask(body).unwrap();
          setNewTaskColumnId(null);
          onRefresh();
          toast.success("Task created.");
        }}
        onOpenChange={(open) => {
          if (!open) setNewTaskColumnId(null);
        }}
        onSave={async () => undefined}
      />
    </div>
  );
}

interface TrackerColumnProps {
  column: TrackerStatus;
  kanban: UseKanbanReturn<LiveTrackerTask>;
  onAdd: () => void;
  onDelete: (taskId: string) => Promise<void>;
  onDuplicate: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
  onMove: (taskId: string, targetColumn: string) => Promise<void>;
  onPersist: (taskIds: string[]) => void;
}

function TrackerColumn({
  column,
  kanban,
  onAdd,
  onDelete,
  onDuplicate,
  onEdit,
  onMove,
  onPersist,
}: TrackerColumnProps) {
  const { renderDropIndicator } = useKanbanCardPlaceholder({
    renderIndicator: (target) => <Kanban.DropIndicator target={target} />,
  });
  const { dragAndDropHooks, items } = usePersistentKanbanColumn(kanban, column, onPersist, {
    renderDropIndicator,
  });
  const meta = COLUMN_META[column];

  return (
    <Kanban.Column>
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator className={meta.indicator} />
        <Kanban.ColumnTitle>{column}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{items.length}</Kanban.ColumnCount>
        <Kanban.ColumnActions>
          <IconButton label={`Add ${column} task`} size="sm" variant="ghost" onPress={onAdd}>
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
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onEdit={onEdit}
                onMove={onMove}
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
  column: TrackerStatus;
  kanban: UseKanbanReturn<LiveTrackerTask>;
  taskId: string;
  onDelete: (taskId: string) => Promise<void>;
  onDuplicate: (taskId: string) => Promise<void>;
  onEdit: (taskId: string) => void;
  onMove: (taskId: string, targetColumn: string) => Promise<void>;
}

function TrackerCardContextMenu({
  children,
  column,
  onDelete,
  onDuplicate,
  onEdit,
  onMove,
  taskId,
}: TrackerCardContextMenuProps) {
  const portalContainer = useSheetPortal();
  const otherColumns = TRACKER_COLUMNS.filter((c) => c !== column);

  return (
    <ContextMenu>
      <ContextMenu.Trigger className="flex flex-col gap-[inherit]">{children}</ContextMenu.Trigger>
      <ContextMenu.Popover UNSTABLE_portalContainer={portalContainer || undefined}>
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

function TrackerLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-4 pb-10">
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
    <div className="mx-auto flex max-w-7xl px-5 pt-4 pb-10">
      <EmptyState className="bg-surface-secondary w-full rounded-2xl">
        <EmptyState.Header>
          <EmptyState.Title>Tracker is unavailable</EmptyState.Title>
          <EmptyState.Description>Try loading the board again in a moment.</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button variant="outline" onPress={onRetry}>
            <ArrowsRotateLeft aria-hidden="true" className="size-4" /> Refresh
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  );
}

function TrackerEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-7xl px-5 pt-4 pb-10">
      <EmptyState className="bg-surface-secondary w-full rounded-2xl">
        <EmptyState.Header>
          <EmptyState.Title>Your tracker is ready for its first task</EmptyState.Title>
          <EmptyState.Description>
            Default columns will appear after the workspace finishes initializing.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button variant="outline" onPress={onRetry}>
            <ArrowsRotateLeft aria-hidden="true" className="size-4" /> Refresh board
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  );
}

function TrackerCardContent({ task }: { task: LiveTrackerTask }) {
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

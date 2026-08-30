"use client";

import {
  ArrowRight,
  ArrowRotateLeft,
  Calendar,
  Copy,
  Ellipsis,
  Pencil,
  Plus,
  ThunderboltFill,
  TrashBin,
} from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import { Avatar, Button, Chip, Header, Label, ProgressBar, Skeleton, toast } from "@heroui/react";
import type { UseKanbanReturn } from "@heroui-pro/react";
import { ContextMenu, Kanban, useKanban, useKanbanCardPlaceholder } from "@heroui-pro/react";
import { useState } from "react";
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
import { TrackerTaskDialog } from "./tracker-task-dialog";

type TrackerStatus = string;
export type TrackerTask = {
  id: string;
  title: string;
  status: TrackerStatus;
  categories: string[];
  epic: string;
  priority: { color: "accent" | "success" | "warning" | "danger"; label: string };
  size: "S" | "M" | "L" | "XL";
  assignees: Array<{ avatar: string; name: string }>;
  dueDate?: string;
  subtasks?: { completed: number; total: number };
  source: KanbanTask;
};

interface ColumnMeta {
  bodyBg: string;
  btnStyle: string;
  countColor: string;
  indicator: string;
  pillBg: string;
}

const COLUMN_META_STYLES: Record<string, ColumnMeta> = {
  Done: {
    bodyBg: "bg-success/8",
    btnStyle: "text-success border-success/30 hover:bg-success/10",
    countColor: "text-success",
    indicator: "bg-success",
    pillBg: "bg-success/15",
  },
  "In Progress": {
    bodyBg: "bg-warning/8",
    btnStyle: "text-warning border-warning/30 hover:bg-warning/10",
    countColor: "text-warning",
    indicator: "bg-warning",
    pillBg: "bg-warning/15",
  },
  "To Do": {
    bodyBg: "bg-accent/8",
    btnStyle: "text-accent border-accent/30 hover:bg-accent/10",
    countColor: "text-accent",
    indicator: "bg-accent",
    pillBg: "bg-accent/15",
  },
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <p className="text-muted text-sm">Track work across your team.</p>

      <Kanban hideScrollBar className="items-start overflow-visible">
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
            onAdd={() => {
              const targetColumn = board.find((item) => item.name === column);
              if (targetColumn) setNewTaskColumnId(targetColumn.id);
            }}
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
        onOpenChange={(open) => {
          if (!open) setNewTaskColumnId(null);
        }}
        onCreate={async (body) => {
          await createTask(body).unwrap();
          setNewTaskColumnId(null);
          onRefresh();
          toast.success("Task created.");
        }}
        onSave={async () => undefined}
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
  onAdd: () => void;
}

function TrackerColumn({
  column,
  kanban,
  onMove,
  onPersist,
  onDuplicate,
  onDelete,
  onEdit,
  onAdd,
}: TrackerColumnProps) {
  const { renderDropIndicator } = useKanbanCardPlaceholder({
    renderIndicator: (target) => <Kanban.DropIndicator target={target} />,
  });
  const { dragAndDropHooks, items } = usePersistentKanbanColumn(kanban, column, onPersist, {
    renderDropIndicator,
  });
  const meta = COLUMN_META_STYLES[column] ?? {
    bodyBg: "bg-default/8",
    btnStyle: "text-muted border-default/30 hover:bg-default/10",
    countColor: "text-muted",
    indicator: "bg-default",
    pillBg: "bg-default/15",
  };

  return (
    <Kanban.Column className="gap-0">
      <div className="bg-background sticky top-0 z-10 pt-2">
        <Kanban.ColumnHeader
          className={`rounded-t-[calc(var(--radius-2xl)_+_var(--radius-sm))] px-3 py-2.5 ${meta.bodyBg}`}
        >
          <span
            className={`flex items-center gap-2 rounded-[calc(var(--radius)*infinity)] px-3 py-1 ${meta.pillBg}`}
          >
            <Kanban.ColumnIndicator className={meta.indicator} />
            <Kanban.ColumnTitle>{column}</Kanban.ColumnTitle>
          </span>
          <Kanban.ColumnCount className={meta.countColor}>{items.length}</Kanban.ColumnCount>
          <Kanban.ColumnActions>
            <IconButton
              label={`Add ${column} task`}
              className={meta.countColor}
              size="sm"
              variant="ghost"
              onPress={onAdd}
            >
              <Plus />
            </IconButton>
            <IconButton
              label={`More ${column} options`}
              className={meta.countColor}
              size="sm"
              variant="ghost"
            >
              <Ellipsis />
            </IconButton>
          </Kanban.ColumnActions>
        </Kanban.ColumnHeader>
      </div>
      <Kanban.ColumnBody className={`rounded-t-none ${meta.bodyBg}`}>
        <Kanban.CardList
          aria-label={column}
          className="pt-0 pb-2"
          dragAndDropHooks={dragAndDropHooks}
          items={items}
          renderEmptyState={() => "No tasks yet."}
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
        <div className="p-2 pt-0">
          <Button fullWidth className={meta.btnStyle} variant="outline" onPress={onAdd}>
            <Plus />
            New task
          </Button>
        </div>
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
  const priorityDot = {
    danger: "bg-danger",
    warning: "bg-warning",
    success: "bg-success",
    accent: "bg-accent",
  }[task.priority.color];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <span className={`mt-1 size-2.5 shrink-0 rounded-sm ${priorityDot}`} />
        <span
          className={`text-foreground leading-snug font-semibold ${isDone ? "line-through opacity-60" : ""}`}
        >
          {task.title}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip color={task.priority.color} size="sm" variant="soft">
          {task.priority.label}
        </Chip>
        <Chip size="sm" variant="secondary">
          {task.size}
        </Chip>
        {task.assignees.slice(0, 3).map((assignee) => (
          <Avatar key={assignee.name} className="ring-background size-5 ring-2" size="sm">
            <Avatar.Image alt={assignee.name} src={assignee.avatar} />
            <Avatar.Fallback>{assignee.name[0]}</Avatar.Fallback>
          </Avatar>
        ))}
      </div>

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

      <div className="text-muted flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1">
          <ThunderboltFill className="text-warning size-3 shrink-0" />
          <span className="truncate">{task.epic}</span>
        </span>
        {task.dueDate ? (
          <span className="flex shrink-0 items-center gap-1 tabular-nums">
            <Calendar className="size-3" />
            {task.dueDate}
          </span>
        ) : null}
      </div>

      {task.categories.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {task.categories.slice(0, 3).map((category) => (
            <Chip key={category} size="sm" variant="secondary">
              {category}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function toTrackerTask(task: KanbanTask, status: string): TrackerTask {
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
    categories: task.tags.map((tag) => tag.name),
    epic: task.epic,
    priority: priorityTag,
    size: task.size,
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

function TrackerEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-7xl px-5 pt-8 pb-10">
      <EmptyState className="bg-surface-secondary w-full rounded-2xl">
        <EmptyState.Header>
          <EmptyState.Title>Your tracker is ready for its first task</EmptyState.Title>
          <EmptyState.Description>
            Default columns will appear after the workspace finishes initializing.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button variant="outline" onPress={onRetry}>
            <ArrowRotateLeft aria-hidden="true" className="size-4" /> Refresh board
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  );
}

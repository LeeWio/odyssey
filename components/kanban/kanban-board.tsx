"use client";

import React from "react";
import {
  Kanban,
  useKanban,
  useKanbanColumn,
  useKanbanCardPlaceholder,
  UseKanbanReturn,
} from "@heroui-pro/react";
import { Button, Tooltip } from "@heroui/react";
import { Plus, Ellipsis } from "@gravity-ui/icons";
import { KanbanTask, KanbanColumn as IKanbanColumn } from "./type";
import { MOCK_TASKS, MOCK_BOARD } from "./mock-data";
import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  column: IKanbanColumn;
  kanban: UseKanbanReturn<KanbanTask>;
}

interface ColumnMeta {
  bodyBg: string;
  btnStyle: string;
  countColor: string;
  indicator: string;
  pillBg: string;
}

const columnMeta: Record<string, ColumnMeta> = {
  done: {
    bodyBg: "bg-success/8",
    btnStyle: "text-success border-success/30 hover:bg-success/10",
    countColor: "text-success",
    indicator: "bg-success",
    pillBg: "bg-success/15",
  },
  in_progress: {
    bodyBg: "bg-warning/8",
    btnStyle: "text-warning border-warning/30 hover:bg-warning/10",
    countColor: "text-warning",
    indicator: "bg-warning",
    pillBg: "bg-warning/15",
  },
  backlog: {
    bodyBg: "bg-danger/8",
    btnStyle: "text-danger border-danger/30 hover:bg-danger/10",
    countColor: "text-danger",
    indicator: "bg-danger",
    pillBg: "bg-danger/15",
  },
  todo: {
    bodyBg: "bg-accent/8",
    btnStyle: "text-accent border-accent/30 hover:bg-accent/10",
    countColor: "text-accent",
    indicator: "bg-accent",
    pillBg: "bg-accent/15",
  },
};

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({ column, kanban }) => {
  const { renderDropIndicator } = useKanbanCardPlaceholder({
    renderIndicator: (target) => <Kanban.DropIndicator target={target} />,
  });
  const { dragAndDropHooks, items } = useKanbanColumn(kanban, column.id, { renderDropIndicator });

  const meta = columnMeta[column.key] ?? {
    bodyBg: "bg-default/8",
    btnStyle: "text-muted-foreground border-default/30 hover:bg-default/10",
    countColor: "text-muted-foreground",
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
            <Kanban.ColumnTitle className="text-sm font-semibold">
              {column.title}
            </Kanban.ColumnTitle>
          </span>
          <Kanban.ColumnCount className={meta.countColor}>{items.length}</Kanban.ColumnCount>
          <Kanban.ColumnActions>
            <Tooltip delay={300}>
              <Button
                isIconOnly
                aria-label="Add task"
                className={meta.countColor}
                size="sm"
                variant="ghost"
              >
                <Plus className="size-4" />
              </Button>
              <Tooltip.Content>Add task</Tooltip.Content>
            </Tooltip>
            <Tooltip delay={300}>
              <Button
                isIconOnly
                aria-label="More options"
                className={meta.countColor}
                size="sm"
                variant="ghost"
              >
                <Ellipsis className="size-4" />
              </Button>
              <Tooltip.Content>More options</Tooltip.Content>
            </Tooltip>
          </Kanban.ColumnActions>
        </Kanban.ColumnHeader>
      </div>
      <Kanban.ColumnBody className={`rounded-t-none ${meta.bodyBg}`}>
        <Kanban.CardList
          aria-label={column.title}
          className="pb-2 pt-0"
          dragAndDropHooks={dragAndDropHooks}
          items={items}
          renderEmptyState={() => (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-xs italic">
              No tasks yet.
            </div>
          )}
        >
          {(task: KanbanTask) => (
            <Kanban.Card textValue={task.title}>
              <TaskCard task={task} />
            </Kanban.Card>
          )}
        </Kanban.CardList>
        <div className="p-2 pt-0">
          <Button fullWidth className={meta.btnStyle} variant="outline">
            <Plus className="size-4" />
            New task
          </Button>
        </div>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
};

export default function KanbanBoard() {
  const kanban = useKanban < KanbanTask > ({
    initialItems: MOCK_TASKS,
    getColumn: (item) => item.columnId,
    setColumn: (item, columnId) => ({ ...item, columnId }),
  });

  const sortedColumns = [...MOCK_BOARD.columns].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="w-full pr-3">
      <Kanban hideScrollBar className="items-start overflow-visible">
        {sortedColumns.map((col) => (
          <KanbanColumnComponent key={col.id} column={col} kanban={kanban} />
        ))}
      </Kanban>
    </div>
  );
}

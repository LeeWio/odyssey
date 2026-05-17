"use client";

import type { UseKanbanReturn } from "@heroui-pro/react";
import { Calendar, Ellipsis, Plus, ThunderboltFill } from "@gravity-ui/icons";
import { Avatar, Button, Chip, Tooltip } from "@heroui/react";

import { Kanban } from "@heroui-pro/react";
import { useKanban, useKanbanCardPlaceholder, useKanbanColumn } from "@heroui-pro/react";

type Priority = "High" | "Medium" | "Low";
type Size = "S" | "M" | "L" | "XL";

interface NotionTask {
  assignees: Array<{ avatar: string; name: string }>;
  categories: string[];
  dueDate?: string;
  epic: string;
  id: string;
  priority: Priority;
  size: Size;
  status: string;
  title: string;
}

const avatars = {
  alex: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg",
  diego: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/black.jpg",
  emily: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/white.jpg",
  jake: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg",
  maria: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/red.jpg",
  sam: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg",
};

const priorityConfig: Record<
  Priority,
  { chipColor: "danger" | "default" | "success" | "warning"; squareColor: string }
> = {
  High: { chipColor: "danger", squareColor: "bg-danger" },
  Low: { chipColor: "success", squareColor: "bg-success" },
  Medium: { chipColor: "warning", squareColor: "bg-warning" },
};

const notionColumns = ["Todo", "In Progress", "To Document", "Done"];

interface ColumnMeta {
  bodyBg: string;
  btnStyle: string;
  countColor: string;
  indicator: string;
  pillBg: string;
}

const columnMeta: Record<string, ColumnMeta> = {
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
  "To Document": {
    bodyBg: "bg-danger/8",
    btnStyle: "text-danger border-danger/30 hover:bg-danger/10",
    countColor: "text-danger",
    indicator: "bg-danger",
    pillBg: "bg-danger/15",
  },
  Todo: {
    bodyBg: "bg-accent/8",
    btnStyle: "text-accent border-accent/30 hover:bg-accent/10",
    countColor: "text-accent",
    indicator: "bg-accent",
    pillBg: "bg-accent/15",
  },
};

const tasks: NotionTask[] = [
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "Block"],
    epic: "Pro Native (Alpha)",
    id: "n1",
    priority: "High",
    size: "M",
    status: "Todo",
    title: "Calendar Blocks",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Launch", "New Component"],
    dueDate: "Mar 5, 2026",
    epic: "Pro Native (Alpha)",
    id: "n2",
    priority: "High",
    size: "M",
    status: "Todo",
    title: "Pro badge on the Expo Go app",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    epic: "Pro Native (Alpha)",
    id: "n3",
    priority: "Medium",
    size: "M",
    status: "Todo",
    title: "FeedCarousel",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    epic: "Pro Native (Alpha)",
    id: "n4",
    priority: "Medium",
    size: "M",
    status: "Todo",
    title: "FlipCard",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    epic: "Pro Native (Alpha)",
    id: "n5",
    priority: "Medium",
    size: "M",
    status: "Todo",
    title: "NumberPad",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    epic: "Pro Native (Alpha)",
    id: "n6",
    priority: "Medium",
    size: "M",
    status: "Todo",
    title: "Phone Number Input",
  },
  {
    assignees: [{ avatar: avatars.maria, name: "Maria" }],
    categories: ["Mobile", "Block"],
    epic: "Pro Native (Alpha)",
    id: "n7",
    priority: "Medium",
    size: "M",
    status: "Todo",
    title: "Bottom Sheet Blocks",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    dueDate: "Mar 29, 2026",
    epic: "Pro Native (Alpha)",
    id: "n8",
    priority: "High",
    size: "L",
    status: "In Progress",
    title: "MorphButton",
  },
  {
    assignees: [{ avatar: avatars.sam, name: "Sam" }],
    categories: ["Mobile", "Block"],
    epic: "Pro Native (Alpha)",
    id: "n9",
    priority: "Low",
    size: "S",
    status: "In Progress",
    title: "Create Password",
  },
  {
    assignees: [
      { avatar: avatars.sam, name: "Sam" },
      { avatar: avatars.jake, name: "Jake" },
    ],
    categories: ["Mobile", "Block"],
    epic: "Pro Native (Alpha)",
    id: "n10",
    priority: "Low",
    size: "S",
    status: "In Progress",
    title: "OTP Verification",
  },
  {
    assignees: [{ avatar: avatars.sam, name: "Sam" }],
    categories: ["Mobile", "Block"],
    epic: "Pro Native (Alpha)",
    id: "n11",
    priority: "Low",
    size: "S",
    status: "In Progress",
    title: "Login / Sign up",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    dueDate: "Apr 5, 2026",
    epic: "Pro Native (Alpha)",
    id: "n12",
    priority: "High",
    size: "L",
    status: "To Document",
    title: "ProgressButton",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    dueDate: "Apr 5, 2026",
    epic: "Pro Native (Alpha)",
    id: "n13",
    priority: "High",
    size: "L",
    status: "To Document",
    title: "SlideButton",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    dueDate: "Apr 5, 2026",
    epic: "Pro Native (Alpha)",
    id: "n14",
    priority: "High",
    size: "M",
    status: "To Document",
    title: "NumberField",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    dueDate: "Apr 10, 2026",
    epic: "Pro Native (Alpha)",
    id: "n15",
    priority: "High",
    size: "L",
    status: "To Document",
    title: "RadioButtonGroup",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Launch", "New Component"],
    dueDate: "Apr 9, 2026",
    epic: "Pro Native (Alpha)",
    id: "n16",
    priority: "High",
    size: "XL",
    status: "To Document",
    title: "Calendar",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "Block"],
    dueDate: "Mar 29, 2026",
    epic: "Pro Native (Alpha)",
    id: "n17",
    priority: "Medium",
    size: "L",
    status: "To Document",
    title: "Multi Step Bottom Sheet",
  },
  {
    assignees: [{ avatar: avatars.diego, name: "Diego" }],
    categories: ["Mobile", "New Component"],
    epic: "Pro Native (Alpha)",
    id: "n18",
    priority: "Medium",
    size: "M",
    status: "To Document",
    title: "Stepper",
  },
  {
    assignees: [
      { avatar: avatars.emily, name: "Emily" },
      { avatar: avatars.alex, name: "Alex" },
    ],
    categories: ["Mobile"],
    dueDate: "Mar 10, 2026",
    epic: "Pro Native (Alpha)",
    id: "n19",
    priority: "High",
    size: "S",
    status: "Done",
    title: "Pre-release in-app message",
  },
  {
    assignees: [
      { avatar: avatars.sam, name: "Sam" },
      { avatar: avatars.diego, name: "Diego" },
    ],
    categories: ["Mobile", "Improvement"],
    epic: "Pro Native (Alpha)",
    id: "n20",
    priority: "Medium",
    size: "S",
    status: "Done",
    title: "OSS \u2194 PRO Sync",
  },
];

function NotionCard({ task }: { task: NotionTask }) {
  const { chipColor, squareColor } = priorityConfig[task.priority];

  return (
    <>
      <div className="flex items-start gap-2">
        <span className={`mt-1 size-2.5 shrink-0 rounded-sm ${squareColor}`} />
        <span className="text-foreground font-semibold leading-snug">{task.title}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip color={chipColor} size="sm" variant="soft">
          {task.priority}
        </Chip>
        <Chip size="sm" variant="secondary">
          {task.size}
        </Chip>
        {task.assignees.map((a) => (
          <Avatar key={a.name} className="ring-background size-5 ring-2" size="sm">
            <Avatar.Image alt={a.name} src={a.avatar} />
            <Avatar.Fallback>{a.name[0]}</Avatar.Fallback>
          </Avatar>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted flex items-center gap-1 text-xs">
          <ThunderboltFill className="text-warning size-3" />
          {task.epic}
        </span>
        {!!task.dueDate && (
          <span className="text-muted flex shrink-0 items-center gap-1 text-xs">
            <Calendar className="size-3" />
            {task.dueDate}
          </span>
        )}
      </div>

      {task.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.categories.map((cat) => (
            <Chip key={cat} size="sm" variant="secondary">
              {cat}
            </Chip>
          ))}
        </div>
      )}
    </>
  );
}

function NotionColumn({ column, kanban }: { column: string; kanban: UseKanbanReturn<NotionTask> }) {
  const { renderDropIndicator } = useKanbanCardPlaceholder({
    renderIndicator: (target) => <Kanban.DropIndicator target={target} />,
  });
  const { dragAndDropHooks, items } = useKanbanColumn(kanban, column, { renderDropIndicator });

  const meta = columnMeta[column] ?? {
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
            <Tooltip delay={300}>
              <Button
                isIconOnly
                aria-label="Add task"
                className={meta.countColor}
                size="sm"
                variant="ghost"
              >
                <Plus />
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
                <Ellipsis />
              </Button>
              <Tooltip.Content>More options</Tooltip.Content>
            </Tooltip>
          </Kanban.ColumnActions>
        </Kanban.ColumnHeader>
      </div>
      <Kanban.ColumnBody className={`rounded-t-none ${meta.bodyBg}`}>
        <Kanban.CardList
          aria-label={column}
          className="pb-2 pt-0"
          dragAndDropHooks={dragAndDropHooks}
          items={items}
          renderEmptyState={() => "No tasks yet."}
        >
          {(task) => (
            <Kanban.Card textValue={task.title}>
              <NotionCard task={task} />
            </Kanban.Card>
          )}
        </Kanban.CardList>
        <div className="p-2 pt-0">
          <Button fullWidth className={meta.btnStyle} variant="outline">
            <Plus />
            New task
          </Button>
        </div>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
}

export default function KanbanPage() {
  const kanban = useKanban<NotionTask>({
    getColumn: (item) => item.status,
    initialItems: tasks,
    setColumn: (item, column) => ({ ...item, status: column }),
  });

  return (
    <div className="w-full pr-3">
      <Kanban hideScrollBar className="items-start overflow-visible" isEnabled={false}>
        {notionColumns.map((col) => (
          <NotionColumn key={col} column={col} kanban={kanban} />
        ))}
      </Kanban>
    </div>
  );
}

"use client";

import React from "react";
import { Chip, ProgressBar } from "@heroui/react";
import { Calendar, CircleCheck, CircleDashed, ListUl, Tag, CircleInfo } from "@gravity-ui/icons";
import { KanbanTask, TaskPriority, TaskType } from "./type";

interface TaskCardProps {
  task: KanbanTask;
}

const priorityConfig = {
  [TaskPriority.URGENT]: { color: "danger" as const, label: "Urgent", dot: "bg-danger" },
  [TaskPriority.HIGH]: { color: "danger" as const, label: "High", dot: "bg-danger" },
  [TaskPriority.MEDIUM]: { color: "warning" as const, label: "Medium", dot: "bg-warning" },
  [TaskPriority.LOW]: { color: "success" as const, label: "Low", dot: "bg-success" },
  [TaskPriority.NONE]: { color: "default" as const, label: "None", dot: "bg-default" },
};

const typeIcons = {
  [TaskType.TASK]: <CircleCheck className="size-3" />,
  [TaskType.STORY]: <CircleInfo className="size-3" />,
  [TaskType.GOAL]: <Tag className="size-3" />,
  [TaskType.ISSUE]: <CircleDashed className="size-3 text-danger" />,
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { dot } = priorityConfig[task.priority];
  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <>
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            {typeIcons[task.type]}
            <span>{task.type}</span>
          </div>
          <span className="text-foreground font-semibold leading-snug tracking-tight truncate">
            {task.title}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mt-1">
          {task.description}
        </p>
      )}

      {totalSubtasks > 0 && (
        <div className="flex flex-col gap-1.5 my-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ListUl className="size-3" />
              Subtasks
            </span>
            <span className="tabular-nums">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <ProgressBar
            aria-label="Subtasks progress"
            color={task.progress === 100 ? "success" : "accent"}
            size="sm"
            value={task.progress}
          >
            <ProgressBar.Track className="bg-default-200/50">
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {task.labels.map((label) => (
          <Chip key={label.id} size="sm" variant="soft" color={label.color} className="h-5 px-1.5">
            <Tag className="size-2.5" />
            <Chip.Label className="text-[10px] font-bold uppercase tracking-tight ml-1">
              {label.name}
            </Chip.Label>
          </Chip>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-default-100/50">
        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-medium">
          {task.dueDate ? (
            <>
              <Calendar className="size-3 text-accent" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </>
          ) : (
            <>
              <CircleDashed className="size-3 opacity-50" />
              <span>No Date</span>
            </>
          )}
        </div>
        {task.progress === 100 && (
          <div className="flex items-center gap-1 text-success text-[10px] font-bold uppercase">
            <CircleCheck className="size-3" />
            Done
          </div>
        )}
      </div>
    </>
  );
};

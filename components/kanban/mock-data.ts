import { KanbanBoard, KanbanColumn, KanbanTask, TaskPriority, TaskType } from "./type";

export const MOCK_COLUMNS: KanbanColumn[] = [
  { id: "c1", key: "backlog", title: "Backlog", sortOrder: 0 },
  { id: "c2", key: "todo", title: "To Do", sortOrder: 1 },
  { id: "c3", key: "in_progress", title: "In Progress", sortOrder: 2 },
  { id: "c4", key: "done", title: "Done", sortOrder: 3 },
];

export const MOCK_BOARD: KanbanBoard = {
  id: "b1",
  title: "Professional Life Planner",
  description: "Managed goals and tasks for career and personal growth.",
  columns: MOCK_COLUMNS,
};

export const MOCK_TASKS: KanbanTask[] = [
  {
    id: "t1",
    title: "Quarterly Strategy Review",
    description: "Analyze Q1 performance and set Q2 objectives.",
    boardId: "b1",
    columnId: "c3", // In Progress
    type: TaskType.GOAL,
    priority: TaskPriority.HIGH,
    progress: 45,
    subtasks: [
      { id: "s1", title: "Gather data", isCompleted: true, sortOrder: 0 },
      { id: "s2", title: "Draft report", isCompleted: false, sortOrder: 1 },
    ],
    labels: [{ id: "l1", name: "Career", color: "accent" }],
    dueDate: "2026-06-30",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-17T15:00:00Z",
    sortOrder: 0,
  },
  {
    id: "t2",
    title: "Morning Routine Refinement",
    description: "Optimize morning hours for better productivity.",
    boardId: "b1",
    columnId: "c2", // To Do
    type: TaskType.TASK,
    priority: TaskPriority.MEDIUM,
    progress: 0,
    subtasks: [],
    labels: [{ id: "l2", name: "Health", color: "success" }],
    createdAt: "2026-05-15T08:30:00Z",
    updatedAt: "2026-05-15T08:30:00Z",
    sortOrder: 1,
  },
  {
    id: "t3",
    title: "Rust Advanced Patterns",
    description: "Study memory management and concurrency in Rust.",
    boardId: "b1",
    columnId: "c1", // Backlog
    type: TaskType.STORY,
    priority: TaskPriority.LOW,
    progress: 10,
    subtasks: [
      { id: "s3", title: "Read Chapter 4", isCompleted: true, sortOrder: 0 },
      { id: "s4", title: "Implement Example", isCompleted: false, sortOrder: 1 },
    ],
    labels: [{ id: "l3", name: "Learning", color: "default" }],
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-10T09:00:00Z",
    sortOrder: 2,
  },
  {
    id: "t4",
    title: "Finalize Kanban UI",
    description: "Ensure all components follow the professional design guidelines.",
    boardId: "b1",
    columnId: "c4", // Done
    type: TaskType.ISSUE,
    priority: TaskPriority.URGENT,
    progress: 100,
    subtasks: [
      { id: "s5", title: "Design Types", isCompleted: true, sortOrder: 0 },
      { id: "s6", title: "Refactor Components", isCompleted: true, sortOrder: 1 },
    ],
    labels: [{ id: "l4", name: "Development", color: "warning" }],
    createdAt: "2026-05-16T11:00:00Z",
    updatedAt: "2026-05-17T16:00:00Z",
    sortOrder: 3,
  },
];

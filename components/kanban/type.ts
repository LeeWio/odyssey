/**
 * @file type.ts
 * @description Professional Kanban Data Structures and Type Definitions
 * Designed for high extensibility and 1:1 mapping with Java backend DTOs.
 */

/**
 * Task Priority levels following industry standards (e.g., Jira/Linear)
 */
export enum TaskPriority {
  URGENT = "URGENT",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  NONE = "NONE",
}

/**
 * Task Type for categorizing different kinds of work items
 */
export enum TaskType {
  TASK = "TASK",
  STORY = "STORY",
  GOAL = "GOAL",
  ISSUE = "ISSUE",
}

/**
 * Label/Tag metadata for grouping and filtering
 */
export interface KanbanLabel {
  id: string;
  name: string;
  color: "default" | "accent" | "success" | "warning" | "danger";
}

/**
 * Subtask model for granular progress tracking
 */
export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
}

/**
 * Core Task Model
 * Represents a single draggable item on the board.
 */
export interface KanbanTask {
  id: string;
  title: string;
  description: string | null;

  // Relationship
  boardId: string;
  columnId: string; // Current status/column identification

  // Metadata
  type: TaskType;
  priority: TaskPriority;

  // Progress tracking
  progress: number; // Calculated percentage (0-100)
  subtasks: Subtask[];

  // Classification
  labels: KanbanLabel[];

  // Chronology (ISO 8601 strings)
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;

  // Sorting
  sortOrder: number; // Position within the column
}

/**
 * Kanban Column Definition
 */
export interface KanbanColumn {
  id: string;
  key: string; // Unique status key (e.g., 'backlog', 'todo', 'done')
  title: string; // Display name
  sortOrder: number; // Order of columns from left to right
  wipLimit?: number; // Work In Progress limit
}

/**
 * Kanban Board Container
 */
export interface KanbanBoard {
  id: string;
  title: string;
  description?: string;
  columns: KanbanColumn[];
  metadata?: Record<string, unknown>;
}

/**
 * UI State for the Kanban Component
 */
export interface KanbanUIState {
  activeBoardId: string | null;
  isDragging: boolean;
  searchQuery: string;
  filters: {
    priority: TaskPriority[];
    labels: string[];
    type: TaskType[];
  };
}

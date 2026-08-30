import { z } from "zod";

export const KanbanPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const KanbanTaskSizeSchema = z.enum(["S", "M", "L", "XL"]);

export const KanbanAssigneeSchema = z.object({
  id: z.number(),
  username: z.string(),
  nickname: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const KanbanTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
});

export const KanbanChecklistItemSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  title: z.string(),
  completed: z.boolean(),
  orderIndex: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const KanbanTaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  priority: KanbanPrioritySchema,
  epic: z.string(),
  size: KanbanTaskSizeSchema,
  orderIndex: z.number(),
  columnId: z.number(),
  reminderAt: z.string().nullable(),
  tags: z.array(KanbanTagSchema),
  assignees: z.array(KanbanAssigneeSchema),
  checklistItems: z.array(KanbanChecklistItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const KanbanColumnSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  orderIndex: z.number(),
  items: z.array(KanbanTaskSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const KanbanRelocateTaskRequestSchema = z.object({
  itemId: z.number(),
  targetColumnId: z.number(),
  targetOrderIndex: z.number().nonnegative(),
});

export const KanbanTaskRequestSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(2000).nullable().optional(),
  priority: KanbanPrioritySchema,
  epic: z.string().max(255).optional(),
  size: KanbanTaskSizeSchema.optional(),
  columnId: z.number(),
  orderIndex: z.number().nonnegative().optional(),
  reminderAt: z.string().nullable().optional(),
  tagIds: z.array(z.number()).nullable().optional(),
  assigneeIds: z.array(z.number()).nullable().optional(),
});

export const KanbanChecklistRequestSchema = z.object({
  title: z.string().min(1).max(255),
  completed: z.boolean(),
  orderIndex: z.number().nonnegative().optional(),
});

export type KanbanColumn = z.infer<typeof KanbanColumnSchema>;
export type KanbanTask = z.infer<typeof KanbanTaskSchema>;
export type KanbanRelocateTaskRequest = z.infer<typeof KanbanRelocateTaskRequestSchema>;
export type KanbanTaskRequest = z.infer<typeof KanbanTaskRequestSchema>;
export type KanbanChecklistRequest = z.infer<typeof KanbanChecklistRequestSchema>;

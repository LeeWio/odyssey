import { z } from "zod";

export const LifeListStatusSchema = z.enum(["planned", "in_progress", "completed", "abandoned"]);
export const LifeListVisibilitySchema = z.enum(["public", "private"]);

export const LifeListCategoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  sortOrder: z.number(),
});

export const LifeListMemoryResponseSchema = z.object({
  id: z.number(),
  itemId: z.number(),
  occurredAt: z.string().nullable(),
  content: z.string(),
  location: z.string().nullable(),
  visibility: LifeListVisibilitySchema,
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const LifeListItemResponseSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  motivation: z.string().nullable(),
  category: LifeListCategoryResponseSchema.nullable(),
  status: LifeListStatusSchema,
  visibility: LifeListVisibilitySchema,
  sortOrder: z.number(),
  completedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  memoryCount: z.number(),
  memories: z.array(LifeListMemoryResponseSchema).default([]),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const LifeListSummaryResponseSchema = z.object({
  completed: z.number(),
  total: z.number(),
  includesPrivate: z.boolean(),
});

export const LifeListPageResponseSchema = z.object({
  list: z.array(LifeListItemResponseSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
  totalPages: z.number(),
  summary: LifeListSummaryResponseSchema,
});

export const LifeListItemRequestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(8000).nullable().optional(),
  motivation: z.string().max(4000).nullable().optional(),
  categoryId: z.number().nullable().optional(),
  status: LifeListStatusSchema,
  visibility: LifeListVisibilitySchema,
  sortOrder: z.number().int().optional(),
  completedAt: z.string().nullable().optional(),
});

export const LifeListStatusRequestSchema = z.object({
  status: LifeListStatusSchema,
  completedAt: z.string().nullable().optional(),
});

export const LifeListMemoryRequestSchema = z.object({
  occurredAt: z.string().nullable().optional(),
  content: z.string().trim().min(1).max(8000),
  location: z.string().max(160).nullable().optional(),
  visibility: LifeListVisibilitySchema,
});

export type LifeListStatus = z.infer<typeof LifeListStatusSchema>;
export type LifeListVisibility = z.infer<typeof LifeListVisibilitySchema>;
export type LifeListCategoryResponse = z.infer<typeof LifeListCategoryResponseSchema>;
export type LifeListMemoryResponse = z.infer<typeof LifeListMemoryResponseSchema>;
export type LifeListItemResponse = z.infer<typeof LifeListItemResponseSchema>;
export type LifeListSummaryResponse = z.infer<typeof LifeListSummaryResponseSchema>;
export type LifeListPageResponse = z.infer<typeof LifeListPageResponseSchema>;
export type LifeListItemRequest = z.infer<typeof LifeListItemRequestSchema>;
export type LifeListStatusRequest = z.infer<typeof LifeListStatusRequestSchema>;
export type LifeListMemoryRequest = z.infer<typeof LifeListMemoryRequestSchema>;

export interface LifeListQuery {
  category?: string;
  status?: LifeListStatus;
  archived?: boolean;
  page?: number;
  size?: number;
}

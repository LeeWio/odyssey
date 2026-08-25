import { z } from "zod";

/** Shared transport envelope returned by every Nexus JSON endpoint. */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface CursorPageResult<T> {
  list: T[];
  nextCursor: number | null;
  hasMore: boolean;
  total: number;
}

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema,
    traceId: z.string().optional(),
  });

export const pageResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z
      .array(itemSchema)
      .nullable()
      .transform((items) => items ?? []),
    total: z.number(),
    page: z.number(),
    size: z.number(),
    totalPages: z.number(),
  });

export const cursorPageResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z
      .array(itemSchema)
      .nullable()
      .transform((items) => items ?? []),
    nextCursor: z.number().nullable(),
    hasMore: z.boolean(),
    total: z.number().nonnegative().default(0),
  });

import { z } from "zod";

export const CategoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().default(""),
  icon: z.string().nullable().default(""),
  createdAt: z.string(),
  translations: z
    .record(
      z.string(),
      z.object({
        locale: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export interface CategoryTranslation {
  name: string;
  description?: string;
}

export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  translations?: Record<string, CategoryTranslation>;
}

import { z } from "zod";

export const CategoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().default(""),
  icon: z.string().nullable().default(""),
  createdAt: z.string(),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

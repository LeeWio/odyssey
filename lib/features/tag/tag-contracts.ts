import { z } from "zod";

export const TagResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  translations: z
    .record(z.string(), z.object({ locale: z.string().optional(), name: z.string().optional() }))
    .optional(),
});

export type TagResponse = z.infer<typeof TagResponseSchema>;

export interface TagTranslation {
  name: string;
}

export interface TagRequest {
  name: string;
  slug: string;
  translations?: Record<string, TagTranslation>;
}

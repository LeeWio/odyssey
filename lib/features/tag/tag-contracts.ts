import { z } from "zod";

export const TagResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
});

export type TagResponse = z.infer<typeof TagResponseSchema>;

export interface TagRequest {
  name: string;
  slug: string;
}

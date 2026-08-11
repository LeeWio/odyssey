import { z } from "zod";

export const MomentResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  likesCount: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MomentResponse = z.infer<typeof MomentResponseSchema>;

export interface MomentRequest {
  content: string;
  isPublished: boolean;
}

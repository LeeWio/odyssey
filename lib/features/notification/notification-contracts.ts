import { z } from "zod";

export const NotificationResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  read: z.boolean(),
  readAt: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

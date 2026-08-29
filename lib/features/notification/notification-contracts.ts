import { z } from "zod";

export const NotificationResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  read: z.boolean(),
  saved: z.boolean(),
  readAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

export const NotificationPreferenceSchema = z.object({
  commentNotificationsEnabled: z.boolean(),
  categoryPostNotificationsEnabled: z.boolean(),
  systemNotificationsEnabled: z.boolean(),
  commentEmailNotificationsEnabled: z.boolean(),
  categoryPostEmailNotificationsEnabled: z.boolean(),
  systemEmailNotificationsEnabled: z.boolean(),
});

export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;

export type NotificationView = "inbox" | "saved" | "done";

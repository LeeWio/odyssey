import { z } from "zod";

export const NotificationContextSchema = z.object({
  objectType: z.enum(["POST", "COMMENT", "FRIEND_LINK", "USER"]),
  objectId: z.number().int().positive(),
  actorId: z.number().int().positive().nullable(),
  action: z.enum(["VIEW", "REVIEW", "EDIT", "REVIEW_REPORT"]),
});

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
  context: NotificationContextSchema.nullable().optional(),
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

export const NOTIFICATION_CATEGORIES = [
  "COMMENT",
  "CATEGORY_POST",
  "CREATOR",
  "MODERATION",
  "REPORT",
  "OPERATIONS",
] as const;

export const NotificationCategorySchema = z.enum(NOTIFICATION_CATEGORIES);
export type NotificationCategory = z.infer<typeof NotificationCategorySchema>;

export const NotificationCategoryChannelsSchema = z.object({
  inAppEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  inherited: z.boolean(),
});

export const NotificationCategoryPreferenceSchema = z.object({
  categories: z.object({
    COMMENT: NotificationCategoryChannelsSchema,
    CATEGORY_POST: NotificationCategoryChannelsSchema,
    CREATOR: NotificationCategoryChannelsSchema,
    MODERATION: NotificationCategoryChannelsSchema,
    REPORT: NotificationCategoryChannelsSchema,
    OPERATIONS: NotificationCategoryChannelsSchema,
  }),
});

export type NotificationCategoryPreference = z.infer<typeof NotificationCategoryPreferenceSchema>;

export type NotificationView = "inbox" | "saved" | "done";

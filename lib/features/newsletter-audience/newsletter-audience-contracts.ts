import { z } from "zod";

export const SubscriberStatusSchema = z.enum(["PENDING", "ACTIVE", "UNSUBSCRIBED"]);

export const NewsletterAudienceOverviewSchema = z.object({
  activeSubscribers: z.number().nonnegative(),
  pendingSubscribers: z.number().nonnegative(),
  unsubscribedSubscribers: z.number().nonnegative(),
  verifiedLast30Days: z.number().nonnegative(),
});

export const NewsletterSubscriberSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  status: SubscriberStatusSchema,
  createdAt: z.string(),
  verifiedAt: z.string().nullable(),
});

export const NewsletterDeliveryBatchSchema = z.object({
  id: z.number(),
  status: z.string(),
  recipientCount: z.number().nonnegative(),
  queuedCount: z.number().nonnegative(),
  deliveredCount: z.number().nonnegative(),
  failedCount: z.number().nonnegative(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
});

export const NewsletterDeliverySchema = z.object({
  id: z.number(),
  subscriberId: z.number(),
  status: z.string(),
  attempts: z.number().nonnegative(),
  lastError: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  createdAt: z.string(),
});

export type SubscriberStatus = z.infer<typeof SubscriberStatusSchema>;
export type NewsletterAudienceOverview = z.infer<typeof NewsletterAudienceOverviewSchema>;
export type NewsletterSubscriber = z.infer<typeof NewsletterSubscriberSchema>;
export type NewsletterDeliveryBatch = z.infer<typeof NewsletterDeliveryBatchSchema>;
export type NewsletterDelivery = z.infer<typeof NewsletterDeliverySchema>;

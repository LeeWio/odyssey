import { z } from "zod";

export const DashboardStatsResponseSchema = z.object({
  totalUsers: z.number().default(0),
  totalPosts: z.number().default(0),
  totalComments: z.number().default(0),
  pendingComments: z.number().default(0),
  totalViews: z.number().default(0),
});

export const DailyTrendSchema = z.object({
  date: z.string(),
  pv: z.number().default(0),
  uv: z.number().default(0),
});

export const TopContentSchema = z.object({
  url: z.string(),
  count: z.number().default(0),
});

export const AnalyticsOverviewResponseSchema = z.object({
  todayPv: z.number().default(0),
  todayUv: z.number().default(0),
  yesterdayPv: z.number().default(0),
  yesterdayUv: z.number().default(0),
  pvGrowthRate: z.number().default(0),
  dailyTrends: z.array(DailyTrendSchema).default([]),
  topContent: z.array(TopContentSchema).default([]),
});

export const TopPageSchema = z.object({
  path: z.string(),
  views: z.number().default(0),
  "avs.time": z.string().optional(),
  bounce: z.number().default(0),
  trend: z.string().optional(),
});

export const TopPagesResponseSchema = z.array(TopPageSchema);

export const TrafficMetricSchema = z.object({
  name: z.string(),
  views: z.number().default(0),
  percentage: z.number().default(0),
});

export const TimeSeriesItemSchema = z.object({
  date: z.string(),
  sessions: z.number().default(0),
  users: z.number().default(0),
});

export const MetricSchema = z.object({
  value: z.string().default("0"),
  numericValue: z.number().default(0),
  growthRate: z.number().default(0),
});

export const SummaryMetricsSchema = z.object({
  sessions: MetricSchema.default({ value: "0", numericValue: 0, growthRate: 0 }),
  users: MetricSchema.default({ value: "0", numericValue: 0, growthRate: 0 }),
  bounceRate: MetricSchema.default({ value: "0", numericValue: 0, growthRate: 0 }),
  avgSession: MetricSchema.default({ value: "0", numericValue: 0, growthRate: 0 }),
});

export const TrafficResponseSchema = z.object({
  summary: SummaryMetricsSchema.default({
    sessions: { value: "0", numericValue: 0, growthRate: 0 },
    users: { value: "0", numericValue: 0, growthRate: 0 },
    bounceRate: { value: "0", numericValue: 0, growthRate: 0 },
    avgSession: { value: "0", numericValue: 0, growthRate: 0 },
  }),
  devices: z.array(TrafficMetricSchema).default([]),
  sources: z.array(TrafficMetricSchema).default([]),
  timeSeries: z.array(TimeSeriesItemSchema).default([]),
});

export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponseSchema>;
export type AnalyticsOverviewResponse = z.infer<typeof AnalyticsOverviewResponseSchema>;
export type TopPageResponse = z.infer<typeof TopPageSchema>;
export type TrafficResponse = z.infer<typeof TrafficResponseSchema>;

export const ContentOperationsSummarySchema = z.object({
  publishedPosts: z.number().default(0),
  drafts: z.number().default(0),
  pendingReview: z.number().default(0),
  scheduled: z.number().default(0),
  moments: z.number().default(0),
  pendingComments: z.number().default(0),
  unreadNotifications: z.number().default(0),
  activeSubscribers: z.number().default(0),
});

export const ContentOperationsAttentionItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  href: z.string(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  count: z.number().default(0),
});

export const ContentOperationsQueueItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  excerpt: z.string().nullable().optional(),
  status: z
    .enum(["DRAFT", "PENDING_REVIEW", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED"])
    .nullable(),
  updatedAt: z.string().nullable(),
  href: z.string(),
});

export const ContentOperationsActivityItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  occurredAt: z.string().nullable(),
  href: z.string(),
});

export const ContentOperationsOverviewSchema = z.object({
  summary: ContentOperationsSummarySchema,
  attentionItems: z.array(ContentOperationsAttentionItemSchema).default([]),
  editorialQueue: z.array(ContentOperationsQueueItemSchema).default([]),
  recentActivity: z.array(ContentOperationsActivityItemSchema).default([]),
  generatedAt: z.string(),
});

export type ContentOperationsOverview = z.infer<typeof ContentOperationsOverviewSchema>;

export const EditorialCalendarEntrySchema = z.object({
  id: z.string(),
  type: z.enum(["POST", "MOMENT"]),
  title: z.string(),
  date: z.string(),
  timestamp: z.string(),
  status: z
    .enum(["DRAFT", "PENDING_REVIEW", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED"])
    .nullable(),
  href: z.string(),
});

export const EditorialCalendarResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  entries: z.array(EditorialCalendarEntrySchema).default([]),
});

export type EditorialCalendarResponse = z.infer<typeof EditorialCalendarResponseSchema>;

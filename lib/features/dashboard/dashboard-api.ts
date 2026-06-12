import { z } from "zod";

import { baseApi, ApiResponseSchema, transformError } from "@/lib/features/api/base-api";

// --- Zod Schemas ---

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

export const TrafficResponseSchema = z.object({
  total: z.number().default(0),
  growthRate: z.number().default(0),
  devices: z.array(TrafficMetricSchema).default([]),
  sources: z.array(TrafficMetricSchema).default([]),
  timeSeries: z.array(TimeSeriesItemSchema).default([]),
});

// --- Types ---

export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponseSchema>;
export type AnalyticsOverviewResponse = z.infer<typeof AnalyticsOverviewResponseSchema>;
export type TopPageResponse = z.infer<typeof TopPageSchema>;
export type TrafficResponse = z.infer<typeof TrafficResponseSchema>;

// --- API Injection ---

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Admin: Get dashboard overview statistics (users, posts, etc.)
     */
    getDashboardStats: builder.query<DashboardStatsResponse, void>({
      query: () => ({
        url: "/api/v1/admin/dashboard/stats",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
      rawResponseSchema: ApiResponseSchema(DashboardStatsResponseSchema),
      transformResponse: (response: { data: DashboardStatsResponse }) => response.data,
      transformErrorResponse: transformError,
    }),

    /**
     * Admin: Get traffic analytics overview (PV/UV, growth rates, etc.)
     */
    getAnalyticsOverview: builder.query<AnalyticsOverviewResponse, void>({
      query: () => ({
        url: "/api/v1/admin/analytics/overview",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
      rawResponseSchema: ApiResponseSchema(AnalyticsOverviewResponseSchema),
      transformResponse: (response: { data: AnalyticsOverviewResponse }) => response.data,
      transformErrorResponse: transformError,
    }),

    /**
     * Admin: Get top pages analytics
     */
    getTopPages: builder.query<TopPageResponse[], void>({
      query: () => ({
        url: "/api/v1/admin/analytics/top-pages",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
      rawResponseSchema: ApiResponseSchema(z.array(TopPageSchema)),
      transformResponse: (response: { data: TopPageResponse[] }) => response.data,
      transformErrorResponse: transformError,
    }),

    /**
     * Admin: Get traffic analytics (devices, sources, timeSeries)
     */
    getTrafficAnalytics: builder.query<TrafficResponse, void>({
      query: () => ({
        url: "/api/v1/admin/analytics/traffic",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
      rawResponseSchema: ApiResponseSchema(TrafficResponseSchema),
      transformResponse: (response: { data: TrafficResponse }) => response.data,
      transformErrorResponse: transformError,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDashboardStatsQuery,
  useGetAnalyticsOverviewQuery,
  useGetTopPagesQuery,
  useGetTrafficAnalyticsQuery,
} = dashboardApi;

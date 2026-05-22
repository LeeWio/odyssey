import { ApiResponse } from "@/types";
import { baseApi, transformError, ApiResponseSchema } from "../api/base-api";
import { z } from "zod";

/**
 * --- Zod Schemas for Runtime Validation ---
 */

export const DashboardStatsResponseSchema = z.object({
  totalUsers: z.number(),
  totalPosts: z.number(),
  totalComments: z.number(),
  pendingComments: z.number(),
  totalViews: z.number(),
});

export const AnalyticsOverviewResponseSchema = z.object({
  todayPv: z.number(),
  todayUv: z.number(),
  yesterdayPv: z.number(),
  yesterdayUv: z.number(),
  pvGrowthRate: z.number(),
  topContent: z.array(z.record(z.string(), z.any())),
});

/**
 * --- TypeScript Interfaces ---
 */
export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponseSchema>;
export type AnalyticsOverviewResponse = z.infer<typeof AnalyticsOverviewResponseSchema>;

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get overall statistics for the admin dashboard
     */
    getDashboardStats: builder.query<DashboardStatsResponse, void>({
      query: () => "/api/v1/admin/dashboard/stats",
      rawResponseSchema: ApiResponseSchema(DashboardStatsResponseSchema),
      transformResponse: (response: ApiResponse<DashboardStatsResponse>) => response.data,
      transformErrorResponse: transformError,
      providesTags: ["Dashboard"],
    }),

    /**
     * Retrieve today's traffic overview
     */
    getAnalyticsOverview: builder.query<AnalyticsOverviewResponse, void>({
      query: () => "/api/v1/admin/analytics/overview",
      rawResponseSchema: ApiResponseSchema(AnalyticsOverviewResponseSchema),
      transformResponse: (response: ApiResponse<AnalyticsOverviewResponse>) => response.data,
      transformErrorResponse: transformError,
      providesTags: ["Dashboard"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardStatsQuery, useGetAnalyticsOverviewQuery } = dashboardApi;

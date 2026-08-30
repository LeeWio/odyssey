import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import {
  AnalyticsOverviewResponseSchema,
  DashboardStatsResponseSchema,
  TopPagesResponseSchema,
  TrafficResponseSchema,
  ContentOperationsOverviewSchema,
  type ContentOperationsOverview,
  EditorialCalendarResponseSchema,
  type EditorialCalendarResponse,
  type AnalyticsOverviewResponse,
  type DashboardStatsResponse,
  type TopPageResponse,
  type TrafficResponse,
} from "./dashboard-contracts";

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
      rawResponseSchema: apiResponseSchema(DashboardStatsResponseSchema),
      transformResponse: (response: { data: DashboardStatsResponse }) => response.data,
      transformErrorResponse: transformApiError,
    }),

    getContentOperationsOverview: builder.query<ContentOperationsOverview, void>({
      query: () => ({
        url: "/api/v1/admin/dashboard/content-overview",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
      rawResponseSchema: apiResponseSchema(ContentOperationsOverviewSchema),
      transformResponse: (response: { data: ContentOperationsOverview }) => response.data,
      transformErrorResponse: transformApiError,
    }),

    getEditorialCalendar: builder.query<
      EditorialCalendarResponse,
      { from?: string; to?: string } | void
    >({
      query: (range) => ({
        url: "/api/v1/admin/dashboard/editorial-calendar",
        method: "GET",
        params: range ?? undefined,
      }),
      providesTags: ["Dashboard"],
      rawResponseSchema: apiResponseSchema(EditorialCalendarResponseSchema),
      transformResponse: (response: { data: EditorialCalendarResponse }) => response.data,
      transformErrorResponse: transformApiError,
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
      rawResponseSchema: apiResponseSchema(AnalyticsOverviewResponseSchema),
      transformResponse: (response: { data: AnalyticsOverviewResponse }) => response.data,
      transformErrorResponse: transformApiError,
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
      rawResponseSchema: apiResponseSchema(TopPagesResponseSchema),
      transformResponse: (response: { data: TopPageResponse[] }) => response.data,
      transformErrorResponse: transformApiError,
    }),

    /**
     * Admin: Get traffic analytics (devices, sources, timeSeries)
     */
    getTrafficAnalytics: builder.query<TrafficResponse, number | undefined>({
      query: (days) => ({
        url: "/api/v1/admin/analytics/traffic",
        method: "GET",
        params: days ? { days } : undefined,
      }),
      providesTags: ["Dashboard"],
      rawResponseSchema: apiResponseSchema(TrafficResponseSchema),
      transformResponse: (response: { data: TrafficResponse }) => response.data,
      transformErrorResponse: transformApiError,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDashboardStatsQuery,
  useGetContentOperationsOverviewQuery,
  useGetEditorialCalendarQuery,
  useGetAnalyticsOverviewQuery,
  useGetTopPagesQuery,
  useGetTrafficAnalyticsQuery,
} = dashboardApi;

import type { ApiResponse, PageResult } from "@/lib/api";
import { apiResponseSchema, baseApi, pageResultSchema, transformApiError } from "@/lib/api";

import {
  NewsletterAudienceOverviewSchema,
  NewsletterDeliveryBatchSchema,
  NewsletterDeliverySchema,
  NewsletterSubscriberSchema,
  type NewsletterAudienceOverview,
  type NewsletterDelivery,
  type NewsletterDeliveryBatch,
  type NewsletterSubscriber,
  type SubscriberStatus,
} from "./newsletter-audience-contracts";

export const newsletterAudienceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNewsletterAudienceOverview: builder.query<NewsletterAudienceOverview, void>({
      query: () => "/api/v1/admin/newsletter/overview",
      rawResponseSchema: apiResponseSchema(NewsletterAudienceOverviewSchema),
      transformResponse: (response: ApiResponse<NewsletterAudienceOverview>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: ["Dashboard"],
    }),
    getNewsletterSubscribers: builder.query<
      PageResult<NewsletterSubscriber>,
      { page: number; query?: string; size?: number; status?: SubscriberStatus }
    >({
      query: ({ page, query, size = 20, status }) => ({
        url: "/api/v1/admin/newsletter/subscribers",
        params: { page, query, size, sort: ["createdAt,desc"], status },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(NewsletterSubscriberSchema)),
      transformResponse: (response: ApiResponse<PageResult<NewsletterSubscriber>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: ["Dashboard"],
    }),
    getRecentNewsletterDeliveries: builder.query<NewsletterDeliveryBatch[], void>({
      query: () => "/api/v1/admin/newsletter/deliveries",
      rawResponseSchema: apiResponseSchema(NewsletterDeliveryBatchSchema.array()),
      transformResponse: (response: ApiResponse<NewsletterDeliveryBatch[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: ["Dashboard"],
    }),
    getNewsletterDeliveryDetails: builder.query<
      PageResult<NewsletterDelivery>,
      { batchId: number; page: number; size?: number }
    >({
      query: ({ batchId, page, size = 20 }) => ({
        url: `/api/v1/admin/newsletter/deliveries/${batchId}`,
        params: { page, size, sort: ["createdAt,desc"] },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(NewsletterDeliverySchema)),
      transformResponse: (response: ApiResponse<PageResult<NewsletterDelivery>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: ["Dashboard"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNewsletterAudienceOverviewQuery,
  useGetNewsletterSubscribersQuery,
  useGetRecentNewsletterDeliveriesQuery,
  useGetNewsletterDeliveryDetailsQuery,
} = newsletterAudienceApi;

import { z } from "zod";

import {
  apiResponseSchema,
  baseApi,
  pageResultSchema,
  transformApiError,
  type ApiResponse,
  type PageResult,
} from "@/lib/api";
import { NotificationContextSchema } from "./notification-contracts";

export const DELIVERY_STATUSES = ["QUEUED", "SENDING", "FAILED", "DELIVERED", "ABANDONED"] as const;
const DeliveryStatusSchema = z.enum(DELIVERY_STATUSES);

const NotificationDeliveryOverviewSchema = z.object({
  counts: z.record(z.string(), z.number()),
  pending: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
  oldestPendingAt: z.string().nullable(),
  observedAt: z.string(),
});

const DeliverySchema = z.object({
  id: z.number().int().positive(),
  notificationId: z.number().int().positive().nullable(),
  channel: z.string(),
  status: DeliveryStatusSchema,
  attempts: z.number().int().nonnegative(),
  maxAttempts: z.number().int().nonnegative(),
  lastError: z.string().nullable(),
  nextAttemptAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  createdAt: z.string(),
  retryable: z.boolean(),
  context: NotificationContextSchema.nullable(),
});

const RetryAuditSchema = z.object({
  id: z.number().int().positive(),
  requestedBy: z.string(),
  reason: z.string(),
  previousStatus: DeliveryStatusSchema,
  previousMaxAttempts: z.number().int().nonnegative(),
  newMaxAttempts: z.number().int().nonnegative(),
  attemptsAtRetry: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;
export type NotificationDeliveryOverview = z.infer<typeof NotificationDeliveryOverviewSchema>;
export type NotificationDelivery = z.infer<typeof DeliverySchema>;
type RetryAudit = z.infer<typeof RetryAuditSchema>;

function unwrapData<T>(response: ApiResponse<T>): T {
  return response.data;
}

const overviewTag = { type: "Notification", id: "DELIVERY_OVERVIEW" } as const;
const listTag = { type: "Notification", id: "DELIVERY_LIST" } as const;
const detailTag = (id: number) => ({ type: "Notification", id: `DELIVERY_${id}` }) as const;
const auditTag = (id: number) => ({ type: "Notification", id: `DELIVERY_RETRIES_${id}` }) as const;

export const notificationDeliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationDeliveryOverview: builder.query<NotificationDeliveryOverview, void>({
      query: () => "/api/v1/admin/notifications/deliveries/overview",
      rawResponseSchema: apiResponseSchema(NotificationDeliveryOverviewSchema),
      transformResponse: unwrapData<NotificationDeliveryOverview>,
      transformErrorResponse: transformApiError,
      providesTags: [overviewTag],
    }),
    listNotificationDeliveries: builder.query<
      PageResult<NotificationDelivery>,
      { status?: DeliveryStatus; page: number }
    >({
      query: (params) => ({ url: "/api/v1/admin/notifications/deliveries", params }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(DeliverySchema)),
      transformResponse: unwrapData<PageResult<NotificationDelivery>>,
      transformErrorResponse: transformApiError,
      providesTags: [listTag],
    }),
    getNotificationDelivery: builder.query<NotificationDelivery, number>({
      query: (id) => `/api/v1/admin/notifications/deliveries/${id}`,
      rawResponseSchema: apiResponseSchema(DeliverySchema),
      transformResponse: unwrapData<NotificationDelivery>,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, id) => [detailTag(id)],
    }),
    getNotificationDeliveryRetries: builder.query<
      PageResult<RetryAudit>,
      { id: number; page: number }
    >({
      query: ({ id, page }) => ({
        url: `/api/v1/admin/notifications/deliveries/${id}/retries`,
        params: { page },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(RetryAuditSchema)),
      transformResponse: unwrapData<PageResult<RetryAudit>>,
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, { id }) => [auditTag(id)],
    }),
    retryNotificationDelivery: builder.mutation<
      NotificationDelivery,
      { id: number; requestId: string; reason: string }
    >({
      query: ({ id, requestId, reason }) => ({
        url: `/api/v1/admin/notifications/deliveries/${id}/retry`,
        method: "POST",
        body: { requestId, reason },
      }),
      rawResponseSchema: apiResponseSchema(DeliverySchema),
      transformResponse: unwrapData<NotificationDelivery>,
      transformErrorResponse: transformApiError,
      invalidatesTags: (result, error, { id }) =>
        result || error?.status === 409 ? [overviewTag, listTag, detailTag(id), auditTag(id)] : [],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationDeliveryOverviewQuery,
  useListNotificationDeliveriesQuery,
  useGetNotificationDeliveryQuery,
  useGetNotificationDeliveryRetriesQuery,
  useRetryNotificationDeliveryMutation,
} = notificationDeliveryApi;

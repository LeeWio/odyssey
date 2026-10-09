import { z } from "zod";

import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";

const NotificationDeliveryOverviewSchema = z.object({
  counts: z.record(z.string(), z.number()),
  pending: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
  oldestPendingAt: z.string().nullable(),
  observedAt: z.string(),
});

export type NotificationDeliveryOverview = z.infer<typeof NotificationDeliveryOverviewSchema>;

export const notificationDeliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationDeliveryOverview: builder.query<NotificationDeliveryOverview, void>({
      query: () => "/api/v1/admin/notifications/deliveries/overview",
      rawResponseSchema: apiResponseSchema(NotificationDeliveryOverviewSchema),
      transformResponse: (response: ApiResponse<NotificationDeliveryOverview>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Notification", id: "DELIVERY_OVERVIEW" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetNotificationDeliveryOverviewQuery } = notificationDeliveryApi;

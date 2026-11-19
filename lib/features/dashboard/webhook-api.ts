import { z } from "zod";

import {
  apiResponseSchema,
  baseApi,
  pageResultSchema,
  type ApiResponse,
  type PageResult,
} from "@/lib/api";

export const webhookEvents = [
  "POST_PUBLISHED",
  "POST_ARCHIVED",
  "POST_DELETED",
  "COMMENT_SUBMITTED",
  "MOMENT_PUBLISHED",
  "MOMENT_DELETED",
] as const;

const EventSchema = z.enum(webhookEvents);
const WebhookSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  events: z.array(EventSchema),
  isActive: z.boolean(),
});
const LogSchema = z.object({
  deliveryId: z.string(),
  event: z.string(),
  responseCode: z.number().nullish(),
  isSuccess: z.boolean().nullish(),
  attemptCount: z.number().nullish(),
  createdAt: z.string(),
  inProgress: z.boolean().optional(),
});
const ReceiptSchema = z.object({ deliveryId: z.string() });

export type Webhook = z.infer<typeof WebhookSchema>;
export type WebhookEvent = z.infer<typeof EventSchema>;
export type WebhookConfig = Omit<Webhook, "id"> & { secret?: string };
type WebhookLog = z.infer<typeof LogSchema>;
type WebhookReceipt = z.infer<typeof ReceiptSchema>;
const listTag = { type: "OpenApi" as const, id: "webhooks" };
const logsTag = (id: number) => ({ type: "OpenApi" as const, id: `webhook-logs:${id}` });

export const webhookApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminWebhooks: builder.query<Webhook[], void>({
      query: () => "/api/v1/admin/webhooks",
      rawResponseSchema: apiResponseSchema(z.array(WebhookSchema)),
      transformResponse: (response: ApiResponse<Webhook[]>) => response.data,
      providesTags: [listTag],
    }),
    createAdminWebhook: builder.mutation<Webhook, WebhookConfig & { secret: string }>({
      query: (body) => ({ url: "/api/v1/admin/webhooks", method: "POST", body }),
      rawResponseSchema: apiResponseSchema(WebhookSchema),
      transformResponse: (response: ApiResponse<Webhook>) => response.data,
      invalidatesTags: (_data, error) => (error ? [] : [listTag]),
    }),
    updateAdminWebhook: builder.mutation<Webhook, { id: number; body: WebhookConfig }>({
      query: ({ id, body }) => ({ url: `/api/v1/admin/webhooks/${id}`, method: "PUT", body }),
      rawResponseSchema: apiResponseSchema(WebhookSchema),
      transformResponse: (response: ApiResponse<Webhook>) => response.data,
      invalidatesTags: (_data, error) => (error ? [] : [listTag]),
    }),
    sendAdminWebhookTest: builder.mutation<WebhookReceipt, number>({
      query: (id) => ({ url: `/api/v1/admin/webhooks/${id}/test`, method: "POST" }),
      rawResponseSchema: apiResponseSchema(ReceiptSchema),
      transformResponse: (response: ApiResponse<WebhookReceipt>) => response.data,
      invalidatesTags: (_data, error, id) => (error ? [] : [logsTag(id)]),
    }),
    retryAdminWebhookDelivery: builder.mutation<
      WebhookLog,
      { deliveryId: string; attemptCount: number }
    >({
      query: ({ deliveryId, attemptCount }) => ({
        url: `/api/v1/admin/webhooks/logs/${encodeURIComponent(deliveryId)}/redeliver`,
        method: "POST",
        params: { attemptCount },
      }),
      rawResponseSchema: apiResponseSchema(LogSchema),
      transformResponse: (response: ApiResponse<WebhookLog>) => response.data,
    }),
    getAdminWebhookLogs: builder.query<PageResult<WebhookLog>, { id: number; page: number }>({
      query: ({ id, page }) => ({
        url: `/api/v1/admin/webhooks/${id}/logs`,
        params: { page, size: 10 },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(LogSchema)),
      transformResponse: (response: ApiResponse<PageResult<WebhookLog>>) => response.data,
      providesTags: (_data, _error, { id }) => [logsTag(id)],
    }),
  }),
});

export const {
  useGetAdminWebhooksQuery,
  useCreateAdminWebhookMutation,
  useUpdateAdminWebhookMutation,
  useSendAdminWebhookTestMutation,
  useGetAdminWebhookLogsQuery,
  useRetryAdminWebhookDeliveryMutation,
} = webhookApi;

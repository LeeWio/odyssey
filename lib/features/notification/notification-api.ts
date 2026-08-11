import { z } from "zod";

import type { ApiResponse, Pageable, PageResult } from "@/lib/api";
import { apiResponseSchema, baseApi, pageResultSchema, transformApiError } from "@/lib/api";
import { NotificationResponseSchema, type NotificationResponse } from "./notification-contracts";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query<
      PageResult<NotificationResponse>,
      Pageable & { unreadOnly?: boolean }
    >({
      query: ({ unreadOnly = false, page = 0, size = 20, sort }) => ({
        url: "/api/v1/user/notifications",
        params: { unreadOnly, page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(NotificationResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<NotificationResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Notification" as const, id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    getUnreadNotificationCount: builder.query<number, void>({
      query: () => "/api/v1/user/notifications/unread/count",
      rawResponseSchema: apiResponseSchema(z.number()),
      transformResponse: (response: ApiResponse<number>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Notification", id: "UNREAD_COUNT" }],
    }),

    markNotificationAsRead: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/user/notifications/${id}/read`, method: "PATCH" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, _error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),

    markAllNotificationsAsRead: builder.mutation<void, void>({
      query: () => ({ url: "/api/v1/user/notifications/read-all", method: "PATCH" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: ["Notification"],
    }),

    deleteNotification: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/user/notifications/${id}`, method: "DELETE" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: (_result, _error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),

    clearReadNotifications: builder.mutation<void, void>({
      query: () => ({ url: "/api/v1/user/notifications/read", method: "DELETE" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      invalidatesTags: ["Notification"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useClearReadNotificationsMutation,
} = notificationApi;

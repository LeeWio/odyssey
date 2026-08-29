import { z } from "zod";

import type { ApiResponse, Pageable, PageResult } from "@/lib/api";
import { apiResponseSchema, baseApi, pageResultSchema, transformApiError } from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
import {
  NotificationPreferenceSchema,
  NotificationResponseSchema,
  type NotificationPreference,
  type NotificationResponse,
  type NotificationView,
} from "./notification-contracts";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query<
      PageResult<NotificationResponse>,
      Pageable & { unreadOnly?: boolean; view?: NotificationView }
    >({
      query: ({ unreadOnly = false, view = "inbox", page = 0, size = 20, sort }) => ({
        url: "/api/v1/user/notifications",
        params: { unreadOnly, view, page, size, sort },
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

    getMyNotificationPreferences: builder.query<NotificationPreference, void>({
      query: () => "/api/v1/user/notifications/preferences",
      rawResponseSchema: apiResponseSchema(NotificationPreferenceSchema),
      transformResponse: (response: ApiResponse<NotificationPreference>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Notification", id: "PREFERENCES" }],
    }),

    updateMyNotificationPreferences: builder.mutation<
      NotificationPreference,
      NotificationPreference
    >({
      query: (body) => ({ url: "/api/v1/user/notifications/preferences", method: "PUT", body }),
      rawResponseSchema: apiResponseSchema(NotificationPreferenceSchema),
      transformResponse: (response: ApiResponse<NotificationPreference>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to save notification preferences.",
          success: "Notification preferences saved.",
        });
      },
      invalidatesTags: [{ type: "Notification", id: "PREFERENCES" }],
    }),

    markNotificationAsRead: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/user/notifications/${id}/read`, method: "PATCH" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, { error: "Failed to mark notification as read." });
      },
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
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to mark all notifications as read.",
          success: "All notifications marked as read.",
        });
      },
      invalidatesTags: ["Notification"],
    }),

    markNotificationAsDone: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/user/notifications/${id}/done`, method: "PATCH" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, { error: "Failed to complete notification." });
      },
      invalidatesTags: ["Notification"],
    }),

    reopenNotification: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/user/notifications/${id}/reopen`, method: "PATCH" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, { error: "Failed to reopen notification." });
      },
      invalidatesTags: ["Notification"],
    }),

    setNotificationSaved: builder.mutation<void, { id: number; saved: boolean }>({
      query: ({ id, saved }) => ({
        url: `/api/v1/user/notifications/${id}/saved`,
        method: "PATCH",
        params: { saved },
      }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, { error: "Failed to update saved notification." });
      },
      invalidatesTags: ["Notification"],
    }),

    deleteNotification: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/user/notifications/${id}`, method: "DELETE" }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to delete notification.",
          success: "Notification deleted.",
        });
      },
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
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to clear notifications.",
          success: "Read notifications cleared.",
        });
      },
      invalidatesTags: ["Notification"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useGetMyNotificationPreferencesQuery,
  useUpdateMyNotificationPreferencesMutation,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsDoneMutation,
  useReopenNotificationMutation,
  useSetNotificationSavedMutation,
  useDeleteNotificationMutation,
  useClearReadNotificationsMutation,
} = notificationApi;

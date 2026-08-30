import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";

import {
  KanbanColumnSchema,
  KanbanTaskSchema,
  type KanbanColumn,
  type KanbanTask,
  type KanbanRelocateTaskRequest,
  type KanbanTaskRequest,
  type KanbanChecklistRequest,
} from "./kanban-contracts";

export const kanbanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKanbanBoard: builder.query<KanbanColumn[], void>({
      query: () => "/api/v1/admin/kanban",
      rawResponseSchema: apiResponseSchema(KanbanColumnSchema.array()),
      transformResponse: (response: ApiResponse<KanbanColumn[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
    relocateKanbanTask: builder.mutation<void, KanbanRelocateTaskRequest>({
      query: (body) => ({
        url: "/api/v1/admin/kanban/tasks/relocate",
        method: "POST",
        body,
      }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
    duplicateKanbanTask: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/admin/kanban/tasks/${id}/duplicate`, method: "POST" }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
    updateKanbanTask: builder.mutation<void, { id: number; body: KanbanTaskRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/kanban/tasks/${id}`,
        method: "PUT",
        body,
      }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
    getKanbanChecklist: builder.query<KanbanTask["checklistItems"], number>({
      query: (taskId) => `/api/v1/admin/kanban/tasks/${taskId}/checklist`,
      rawResponseSchema: apiResponseSchema(KanbanTaskSchema.shape.checklistItems),
      transformResponse: (response: ApiResponse<KanbanTask["checklistItems"]>) => response.data,
      transformErrorResponse: transformApiError,
    }),
    createKanbanChecklistItem: builder.mutation<
      unknown,
      { taskId: number; body: KanbanChecklistRequest }
    >({
      query: ({ taskId, body }) => ({
        url: `/api/v1/admin/kanban/tasks/${taskId}/checklist`,
        method: "POST",
        body,
      }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
    completeKanbanChecklistItem: builder.mutation<
      unknown,
      { taskId: number; itemId: number; completed: boolean }
    >({
      query: ({ taskId, itemId, completed }) => ({
        url: `/api/v1/admin/kanban/tasks/${taskId}/checklist/${itemId}/completion`,
        method: "PATCH",
        body: { completed },
      }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
    updateKanbanChecklistItem: builder.mutation<
      unknown,
      { taskId: number; itemId: number; body: KanbanChecklistRequest }
    >({
      query: ({ taskId, itemId, body }) => ({
        url: `/api/v1/admin/kanban/tasks/${taskId}/checklist/${itemId}`,
        method: "PUT",
        body,
      }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
    deleteKanbanChecklistItem: builder.mutation<unknown, { taskId: number; itemId: number }>({
      query: ({ taskId, itemId }) => ({
        url: `/api/v1/admin/kanban/tasks/${taskId}/checklist/${itemId}`,
        method: "DELETE",
      }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
    deleteKanbanTask: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/v1/admin/kanban/tasks/${id}`, method: "DELETE" }),
      transformErrorResponse: transformApiError,
      invalidatesTags: [{ type: "Kanban", id: "BOARD" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetKanbanBoardQuery,
  useRelocateKanbanTaskMutation,
  useDuplicateKanbanTaskMutation,
  useDeleteKanbanTaskMutation,
  useUpdateKanbanTaskMutation,
  useGetKanbanChecklistQuery,
  useCreateKanbanChecklistItemMutation,
  useCompleteKanbanChecklistItemMutation,
  useUpdateKanbanChecklistItemMutation,
  useDeleteKanbanChecklistItemMutation,
} = kanbanApi;

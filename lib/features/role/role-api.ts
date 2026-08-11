import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import { RoleResponseSchema, type RoleRequest, type RoleResponse } from "./role-contracts";

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all roles
     */
    getAllRoles: builder.query<RoleResponse[], void>({
      query: () => "/api/v1/admin/roles",
      rawResponseSchema: apiResponseSchema(z.array(RoleResponseSchema)),
      transformResponse: (response: ApiResponse<RoleResponse[]>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Role" as const, id })),
              { type: "Role", id: "LIST" },
            ]
          : [{ type: "Role", id: "LIST" }],
    }),

    /**
     * Create a new role
     */
    createRole: builder.mutation<RoleResponse, RoleRequest>({
      query: (body) => ({
        url: "/api/v1/admin/roles",
        method: "POST",
        body,
      }),
      rawResponseSchema: apiResponseSchema(RoleResponseSchema),
      transformResponse: (response: ApiResponse<RoleResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Role created successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to create role");
        }
      },
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),

    /**
     * Update an existing role
     */
    updateRole: builder.mutation<RoleResponse, { id: number; body: RoleRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/roles/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: apiResponseSchema(RoleResponseSchema),
      transformResponse: (response: ApiResponse<RoleResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Role updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update role");
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),

    /**
     * Delete a role
     */
    deleteRole: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/roles/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Role deleted successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to delete role");
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),

    /**
     * Get menu IDs assigned to a specific role
     */
    getRoleMenuIds: builder.query<number[], number>({
      query: (id) => `/api/v1/admin/roles/${id}/menus`,
      rawResponseSchema: apiResponseSchema(z.array(z.number())),
      transformResponse: (response: ApiResponse<number[]>) => response.data || [],
      transformErrorResponse: transformApiError,
      providesTags: (_result, _error, id) => [{ type: "Role" as const, id: `${id}-menus` }],
    }),

    /**
     * Assign menus to a specific role
     */
    assignRoleMenus: builder.mutation<void, { id: number; menuIds: number[] }>({
      query: ({ id, menuIds }) => ({
        url: `/api/v1/admin/roles/${id}/menus`,
        method: "POST",
        body: { menuIds },
      }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Role permissions updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update role permissions");
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Role", id: `${id}-menus` },
        { type: "Menu", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetRoleMenuIdsQuery,
  useAssignRoleMenusMutation,
} = roleApi;

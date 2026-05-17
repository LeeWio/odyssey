import { ApiResponse } from "@/types";
import { baseApi, transformError, ApiResponseSchema } from "../api/base-api";
import { toast } from "@heroui/react";
import { z } from "zod";

/**
 * --- Zod Schemas for Runtime Validation ---
 */
export const RoleResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().default(""),
});

/**
 * --- TypeScript Interfaces (Inferred from Schemas) ---
 */
export type RoleResponse = z.infer<typeof RoleResponseSchema>;

export interface RoleRequest {
  name: string;
  code: string;
  description?: string;
}

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all roles
     */
    getAllRoles: builder.query<RoleResponse[], void>({
      query: () => "/api/v1/admin/roles",
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(z.array(RoleResponseSchema)),
      transformResponse: (response: ApiResponse<RoleResponse[]>) => response.data,
      transformErrorResponse: transformError,
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
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(RoleResponseSchema),
      transformResponse: (response: ApiResponse<RoleResponse>) => response.data,
      transformErrorResponse: transformError,
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
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(RoleResponseSchema),
      transformResponse: (response: ApiResponse<RoleResponse>) => response.data,
      transformErrorResponse: transformError,
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
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
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
  }),
  overrideExisting: false,
});

export const {
  useGetAllRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;

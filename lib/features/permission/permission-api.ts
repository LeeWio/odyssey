import { ApiResponse } from "@/types";
import {
  baseApi,
  transformError,
  ApiResponseSchema,
  getRtkQueryErrorMessage,
} from "../api/base-api";
import { toast } from "@heroui/react";
import { z } from "zod";

/**
 * --- Zod Schemas for Runtime Validation ---
 */

// Define basic fields first to avoid circular dependency
const baseMenuFields = {
  id: z.number(),
  parentId: z.number().nullable().default(0),
  name: z.string(),
  path: z.string().nullable().default(""),
  permission: z.string().nullable().default(""),
  type: z.number(), // 0-Dir, 1-Menu, 2-Button
  icon: z.string().nullable().default(""),
  sortOrder: z.number().nullable().default(0),
  isVisible: z.boolean(),
  isPublic: z.boolean(),
  createdAt: z.string(),
};

// Recursive Menu Response Schema
export type MenuResponse = z.infer<typeof baseSchema> & {
  children?: MenuResponse[];
};

const baseSchema = z.object(baseMenuFields);

export const MenuResponseSchema: z.ZodType<MenuResponse> = baseSchema.extend({
  children: z
    .lazy(() => z.array(MenuResponseSchema))
    .nullable()
    .transform((children) => children ?? []),
});

/**
 * --- TypeScript Interfaces ---
 */
export interface MenuRequest {
  name: string;
  parentId?: number;
  path?: string;
  permission?: string;
  type: number; // 0-Dir, 1-Menu, 2-Button
  icon?: string;
  sortOrder?: number;
  isVisible?: boolean;
  isPublic?: boolean;
}

export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Admin: Retrieve menu tree for the logged-in admin user
     */
    getCurrentUserMenus: builder.query<MenuResponse[], void>({
      query: () => "/api/v1/admin/menus/current",
      rawResponseSchema: ApiResponseSchema(z.array(MenuResponseSchema)),
      transformResponse: (response: ApiResponse<MenuResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: ["Menu"],
    }),

    /**
     * Admin: Retrieve the complete menu hierarchy (Management)
     */
    getAdminMenuTree: builder.query<MenuResponse[], void>({
      query: () => "/api/v1/admin/menus/tree",
      rawResponseSchema: ApiResponseSchema(z.array(MenuResponseSchema)),
      transformResponse: (response: ApiResponse<MenuResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: ["Menu"],
    }),

    /**
     * Public: Retrieve the public navigation menu tree
     */
    getPublicNavigation: builder.query<MenuResponse[], void>({
      query: () => "/api/v1/public/menus/navigation",
      rawResponseSchema: ApiResponseSchema(z.array(MenuResponseSchema)),
      transformResponse: (response: ApiResponse<MenuResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: ["Menu"],
    }),

    /**
     * Admin: Create a new menu item
     */
    createMenu: builder.mutation<MenuResponse, MenuRequest>({
      query: (body) => ({
        url: "/api/v1/admin/menus",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(MenuResponseSchema),
      transformResponse: (response: ApiResponse<MenuResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Menu item created successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Failed to create menu item"));
        }
      },
      invalidatesTags: ["Menu"],
    }),

    /**
     * Admin: Update an existing menu item
     */
    updateMenu: builder.mutation<MenuResponse, { id: number; body: MenuRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/menus/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(MenuResponseSchema),
      transformResponse: (response: ApiResponse<MenuResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Menu item updated successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Failed to update menu item"));
        }
      },
      invalidatesTags: ["Menu"],
    }),

    /**
     * Admin: Delete a menu item
     */
    deleteMenu: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/menus/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Menu item deleted successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Failed to delete menu item"));
        }
      },
      invalidatesTags: ["Menu"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCurrentUserMenusQuery,
  useGetAdminMenuTreeQuery,
  useGetPublicNavigationQuery,
  useCreateMenuMutation,
  useUpdateMenuMutation,
  useDeleteMenuMutation,
} = permissionApi;

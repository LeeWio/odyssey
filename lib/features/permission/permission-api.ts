import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, getApiErrorMessage, transformApiError } from "@/lib/api";
import { MenuResponseSchema, type MenuRequest, type MenuResponse } from "./permission-contracts";

export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Admin: Retrieve menu tree for the logged-in admin user
     */
    getCurrentUserMenus: builder.query<MenuResponse[], void>({
      query: () => "/api/v1/admin/menus/current",
      rawResponseSchema: apiResponseSchema(z.array(MenuResponseSchema)),
      transformResponse: (response: ApiResponse<MenuResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
      providesTags: ["Menu"],
    }),

    /**
     * Admin: Retrieve the complete menu hierarchy (Management)
     */
    getAdminMenuTree: builder.query<MenuResponse[], void>({
      query: () => "/api/v1/admin/menus/tree",
      rawResponseSchema: apiResponseSchema(z.array(MenuResponseSchema)),
      transformResponse: (response: ApiResponse<MenuResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
      providesTags: ["Menu"],
    }),

    /**
     * Public: Retrieve the public navigation menu tree
     */
    getPublicNavigation: builder.query<MenuResponse[], void>({
      query: () => "/api/v1/public/menus/navigation",
      rawResponseSchema: apiResponseSchema(z.array(MenuResponseSchema)),
      transformResponse: (response: ApiResponse<MenuResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
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
      rawResponseSchema: apiResponseSchema(MenuResponseSchema),
      transformResponse: (response: ApiResponse<MenuResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Menu item created successfully!");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Failed to create menu item"));
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
      rawResponseSchema: apiResponseSchema(MenuResponseSchema),
      transformResponse: (response: ApiResponse<MenuResponse>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Menu item updated successfully!");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Failed to update menu item"));
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
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Menu item deleted successfully!");
        } catch (error: unknown) {
          toast.danger(getApiErrorMessage(error, "Failed to delete menu item"));
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

import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse, Pageable, PageResult } from "@/lib/api";
import {
  apiResponseSchema,
  baseApi,
  getApiErrorMessage,
  pageResultSchema,
  transformApiError,
} from "@/lib/api";
import { notifyMutation } from "@/lib/toast";
import { FileResponseSchema, type FileResponse } from "./file-contracts";

export const fileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchFiles: builder.query<PageResult<FileResponse>, Pageable & { keyword?: string }>({
      query: ({ keyword, page = 0, size = 20, sort }) => ({
        url: "/api/v1/admin/files",
        params: { keyword, page, size, sort },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(FileResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<FileResponse>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: ["File"],
    }),

    /**
     * Upload a single file
     */
    uploadFile: builder.mutation<FileResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/api/v1/admin/files/upload",
          method: "POST",
          body: formData,
          // Important: RTK Query will automatically set Content-Type to multipart/form-data
          // and generate the boundary if the body is a FormData object.
        };
      },
      rawResponseSchema: apiResponseSchema(FileResponseSchema),
      transformResponse: (response: ApiResponse<FileResponse>) => response.data,
      transformErrorResponse: transformApiError,
      onQueryStarted(file, { queryFulfilled }) {
        void toast.promise(queryFulfilled, {
          loading: `Uploading ${file.name}...`,
          success: `Uploaded ${file.name}.`,
          error: (error) => getApiErrorMessage(error, `Couldn't upload ${file.name}.`),
        });
      },
      invalidatesTags: ["File"],
    }),

    /**
     * Delete a file by name
     */
    deleteFile: builder.mutation<void, string>({
      query: (fileName) => ({
        url: `/api/v1/admin/files/${fileName}`,
        method: "DELETE",
      }),
      rawResponseSchema: apiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformApiError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        await notifyMutation(queryFulfilled, {
          error: "Failed to delete file.",
          success: "File deleted successfully.",
        });
      },
      invalidatesTags: ["File"],
    }),
  }),
  overrideExisting: false,
});

export const { useSearchFilesQuery, useUploadFileMutation, useDeleteFileMutation } = fileApi;

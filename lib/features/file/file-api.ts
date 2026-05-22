import { ApiResponse } from "@/types";
import { baseApi, transformError, ApiResponseSchema } from "../api/base-api";
import { toast } from "@heroui/react";
import { z } from "zod";

/**
 * --- Zod Schemas for Runtime Validation ---
 */
export const FileResponseSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
});

/**
 * --- TypeScript Interfaces ---
 */
export type FileResponse = z.infer<typeof FileResponseSchema>;

export const fileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      rawResponseSchema: ApiResponseSchema(FileResponseSchema),
      transformResponse: (response: ApiResponse<FileResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("File uploaded successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Upload failed");
        }
      },
    }),

    /**
     * Delete a file by name
     */
    deleteFile: builder.mutation<void, string>({
      query: (fileName) => ({
        url: `/api/v1/admin/files/${fileName}`,
        method: "DELETE",
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("File deleted successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Deletion failed");
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const { useUploadFileMutation, useDeleteFileMutation } = fileApi;

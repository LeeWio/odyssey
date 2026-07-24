import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse, Pageable, PageResult } from "@/types";
import {
  ApiResponseSchema,
  baseApi,
  getRtkQueryErrorMessage,
  PageResultSchema,
  transformError,
} from "../api/base-api";

/**
 * --- Zod Schemas for Runtime Validation ---
 */

export const ProjectResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().default(""),
  coverImage: z.string().nullable().default(""),
  githubUrl: z.string().nullable().default(""),
  previewUrl: z.string().nullable().default(""),
  techStack: z.string().nullable().default(""),
  starsCount: z.number().nullable().default(0),
  forksCount: z.number().nullable().default(0),
  language: z.string().nullable().default(""),
  sortOrder: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
});

/**
 * --- TypeScript Interfaces ---
 */
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

export interface ProjectRequest {
  name: string;
  description?: string;
  coverImage?: string;
  githubUrl?: string;
  previewUrl?: string;
  techStack?: string;
  sortOrder?: number;
  isPublished: boolean;
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Public: Get published projects sorted by priority
     */
    getPublicProjects: builder.query<ProjectResponse[], void>({
      query: () => "/api/v1/public/projects",
      rawResponseSchema: ApiResponseSchema(z.array(ProjectResponseSchema).nullable().default([])),
      transformResponse: (response: ApiResponse<ProjectResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Project" as const, id })),
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),

    /**
     * Admin: Get all projects (paginated)
     */
    getAllProjects: builder.query<PageResult<ProjectResponse>, Pageable>({
      query: ({ page = 0, size = 10 }) => ({
        url: "/api/v1/admin/projects",
        params: { page, size },
      }),
      rawResponseSchema: ApiResponseSchema(PageResultSchema(ProjectResponseSchema)),
      transformResponse: (response: ApiResponse<PageResult<ProjectResponse>>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.list.map(({ id }) => ({ type: "Project" as const, id })),
              { type: "Project", id: "ADMIN_LIST" },
            ]
          : [{ type: "Project", id: "ADMIN_LIST" }],
    }),

    /**
     * Admin: Retrieve project by ID
     */
    getProjectById: builder.query<ProjectResponse, number>({
      query: (id) => `/api/v1/admin/projects/${id}`,
      rawResponseSchema: ApiResponseSchema(ProjectResponseSchema),
      transformResponse: (response: ApiResponse<ProjectResponse>) => response.data,
      transformErrorResponse: transformError,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),

    /**
     * Admin: Create a new project
     */
    createProject: builder.mutation<ProjectResponse, ProjectRequest>({
      query: (body) => ({
        url: "/api/v1/admin/projects",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(ProjectResponseSchema),
      transformResponse: (response: ApiResponse<ProjectResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Project created successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Failed to create project"));
        }
      },
      invalidatesTags: [
        { type: "Project", id: "LIST" },
        { type: "Project", id: "ADMIN_LIST" },
      ],
    }),

    /**
     * Admin: Update an existing project
     */
    updateProject: builder.mutation<ProjectResponse, { id: number; body: ProjectRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/projects/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(ProjectResponseSchema),
      transformResponse: (response: ApiResponse<ProjectResponse>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Project updated successfully!");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Failed to update project"));
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
        { type: "Project", id: "ADMIN_LIST" },
      ],
    }),

    /**
     * Admin: Delete a project
     */
    deleteProject: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/projects/${id}`,
        method: "DELETE",
      }),
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Project deleted successfully");
        } catch (error: unknown) {
          toast.danger(getRtkQueryErrorMessage(error, "Failed to delete project"));
        }
      },
      invalidatesTags: [
        { type: "Project", id: "LIST" },
        { type: "Project", id: "ADMIN_LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPublicProjectsQuery,
  useGetAllProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;

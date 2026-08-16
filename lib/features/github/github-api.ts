import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import { GitHubActivityResponseSchema, type GitHubActivityResponse } from "./github-contracts";

export const githubApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGitHubActivity: builder.query<GitHubActivityResponse, void>({
      query: () => "/api/v1/public/github/activity",
      keepUnusedDataFor: 3600,
      rawResponseSchema: apiResponseSchema(GitHubActivityResponseSchema),
      transformResponse: (response: ApiResponse<GitHubActivityResponse>) => response.data,
      transformErrorResponse: transformApiError,
    }),
  }),
  overrideExisting: false,
});

export const { useGetGitHubActivityQuery } = githubApi;

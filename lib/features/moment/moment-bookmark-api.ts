import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { z } from "zod";

import { apiResponseSchema, baseApi, pageResultSchema, type PageResult } from "@/lib/api";
import type { RootState } from "@/lib/store";
import { clearImportedMomentBookmarks, readLegacyMomentBookmarks } from "./moment-bookmarks";
import { MomentResponseSchema, type MomentResponse } from "./moment-contracts";

const idsSchema = apiResponseSchema(z.array(z.number().int().positive()));
const savedPageSchema = apiResponseSchema(pageResultSchema(MomentResponseSchema));
const sessionChanged = { error: { status: "CUSTOM_ERROR", error: "Session changed" } } as const;
const mutationSchema = apiResponseSchema(z.null()).extend({ code: z.literal(200) });
const importBatchSize = 100;

function bookmarkTag(username: string) {
  return { type: "Moment" as const, id: `bookmarks:${username}` };
}

export const momentBookmarkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    importMomentBookmarks: builder.mutation<void, number[]>({
      query: (ids) => ({ url: "/api/v1/user/moments/saved/import", method: "POST", body: { ids } }),
      rawResponseSchema: mutationSchema,
      transformResponse: () => undefined,
    }),
    getSavedMomentIds: builder.query<number[], string>({
      async queryFn(
        username,
        { dispatch, getState, signal },
        _options,
        fetch
      ): Promise<{ data: number[] } | { error: FetchBaseQueryError }> {
        const isCurrentAccount = () =>
          !signal.aborted && (getState() as RootState).auth.username === username;
        const { snapshot, ids } = readLegacyMomentBookmarks(username);
        for (let start = 0; start < ids.length; start += importBatchSize) {
          if (!isCurrentAccount()) return sessionChanged;
          const result = await dispatch(
            momentBookmarkApi.endpoints.importMomentBookmarks.initiate(
              ids.slice(start, start + importBatchSize),
              { track: false }
            )
          );
          if ("error" in result) {
            return { error: { status: "CUSTOM_ERROR", error: "Bookmark import failed" } };
          }
        }

        if (!isCurrentAccount()) return sessionChanged;
        const result = await fetch("/api/v1/user/moments/saved/ids");
        if (!isCurrentAccount()) return sessionChanged;
        if (result.error) return { error: result.error };

        const parsed = idsSchema.safeParse(result.data);
        if (!parsed.success || parsed.data.code !== 200) {
          return { error: { status: "CUSTOM_ERROR", error: "Invalid bookmark response" } };
        }
        if (snapshot !== null) clearImportedMomentBookmarks(username, snapshot);
        return { data: parsed.data.data };
      },
      providesTags: (_result, _error, username) => [bookmarkTag(username)],
    }),
    getSavedMoments: builder.query<PageResult<MomentResponse>, { username: string; page: number }>({
      async queryFn({ username, page }, { getState }, _options, fetch) {
        const isCurrentAccount = () => (getState() as RootState).auth.username === username;
        if (!isCurrentAccount()) return sessionChanged;
        const result = await fetch({
          url: "/api/v1/user/moments/saved",
          params: { page, size: 12 },
        });
        if (!isCurrentAccount()) return sessionChanged;
        if (result.error) return { error: result.error };

        const parsed = savedPageSchema.safeParse(result.data);
        if (!parsed.success || parsed.data.code !== 200) {
          return { error: { status: "CUSTOM_ERROR", error: "Invalid saved Moments response" } };
        }
        return { data: parsed.data.data };
      },
      providesTags: (result, _error, { username }) => [
        bookmarkTag(username),
        ...(result?.list.map(({ id }) => ({ type: "Moment" as const, id })) ?? []),
      ],
    }),
    saveMomentBookmark: builder.mutation<void, { username: string; id: number }>({
      query: ({ id }) => ({ url: `/api/v1/user/moments/saved/${id}`, method: "PUT" }),
      rawResponseSchema: mutationSchema,
      transformResponse: () => undefined,
      invalidatesTags: (_result, error, { username }) => (error ? [] : [bookmarkTag(username)]),
    }),
    removeMomentBookmark: builder.mutation<void, { username: string; id: number }>({
      query: ({ id }) => ({ url: `/api/v1/user/moments/saved/${id}`, method: "DELETE" }),
      rawResponseSchema: mutationSchema,
      transformResponse: () => undefined,
      invalidatesTags: (_result, error, { username }) => (error ? [] : [bookmarkTag(username)]),
    }),
  }),
});

export const { useGetSavedMomentIdsQuery, useGetSavedMomentsQuery } = momentBookmarkApi;

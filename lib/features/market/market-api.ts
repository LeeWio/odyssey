import { ApiResponse } from "@/types";
import { baseApi, transformError, ApiResponseSchema } from "../api/base-api";
import { z } from "zod";

export const MarketIndexResponseSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  current: z.number(),
  changePct: z.number(),
  sparkline: z.array(z.number()),
});

export type MarketIndexResponse = z.infer<typeof MarketIndexResponseSchema>;

export const marketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMarketIndices: builder.query<MarketIndexResponse[], void>({
      query: () => "/api/v1/public/market/indices",
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(z.array(MarketIndexResponseSchema)),
      transformResponse: (response: ApiResponse<MarketIndexResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
    }),
  }),
  overrideExisting: false,
});

export const { useGetMarketIndicesQuery } = marketApi;
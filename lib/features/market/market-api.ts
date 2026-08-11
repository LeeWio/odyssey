import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import {
  MarketIndexResponseSchema,
  type MarketIndexResponse,
  type MarketPeriod,
} from "./market-contracts";

export const marketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMarketIndices: builder.query<MarketIndexResponse[], MarketPeriod | undefined>({
      query: (period) => ({
        url: "/api/v1/public/market/indices",
        params: { period: period || "1D" },
      }),
      keepUnusedDataFor: 60,
      rawResponseSchema: apiResponseSchema(z.array(MarketIndexResponseSchema)),
      transformResponse: (response: ApiResponse<MarketIndexResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
    }),
    getMarketIndexBySymbol: builder.query<
      MarketIndexResponse,
      { symbol: string; period?: MarketPeriod }
    >({
      query: ({ symbol, period }) => ({
        url: `/api/v1/public/market/indices/${symbol}`,
        params: { period: period || "1D" },
      }),
      keepUnusedDataFor: 60,
      rawResponseSchema: apiResponseSchema(MarketIndexResponseSchema),
      transformResponse: (response: ApiResponse<MarketIndexResponse>) => response.data!,
      transformErrorResponse: transformApiError,
    }),
  }),
  overrideExisting: false,
});

export const { useGetMarketIndicesQuery, useGetMarketIndexBySymbolQuery } = marketApi;

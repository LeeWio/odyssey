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

export type MarketPeriod = "1D" | "1M" | "1Y" | "ALL";

export const marketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMarketIndices: builder.query<MarketIndexResponse[], MarketPeriod | void>({
      query: (period) => ({
        url: "/api/v1/public/market/indices",
        params: { period: period || "1D" },
      }),
      keepUnusedDataFor: 0,
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(z.array(MarketIndexResponseSchema)),
      transformResponse: (response: ApiResponse<MarketIndexResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
    }),
    getMarketIndexBySymbol: builder.query<
      MarketIndexResponse,
      { symbol: string; period?: MarketPeriod }
    >({
      query: ({ symbol, period }) => ({
        url: `/api/v1/public/market/indices/${symbol}`,
        params: { period: period || "1D" },
      }),
      keepUnusedDataFor: 0,
      // @ts-ignore
      rawResponseSchema: ApiResponseSchema(MarketIndexResponseSchema),
      transformResponse: (response: ApiResponse<MarketIndexResponse>) => response.data!,
      transformErrorResponse: transformError,
    }),
  }),
  overrideExisting: false,
});

export const { useGetMarketIndicesQuery, useGetMarketIndexBySymbolQuery } = marketApi;

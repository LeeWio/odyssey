import { z } from "zod";
import type { ApiResponse } from "@/lib/api";
import { apiResponseSchema, baseApi, transformApiError } from "@/lib/api";
import {
  StockSearchResponseSchema,
  StockTrendResponseSchema,
  type StockSearchResponse,
  type StockTrendResponse,
} from "./stock-contracts";

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Search stocks by keyword
     */
    searchStocks: builder.query<StockSearchResponse[], { keyword: string }>({
      query: ({ keyword }) => ({
        url: "/api/v1/public/market/stocks/search",
        params: { keyword },
      }),
      rawResponseSchema: apiResponseSchema(z.array(StockSearchResponseSchema)),
      transformResponse: (response: ApiResponse<StockSearchResponse[]>) => response.data || [],
      transformErrorResponse: transformApiError,
    }),

    /**
     * Get stock trend (e.g. for last 1 month)
     */
    getStockTrend: builder.query<StockTrendResponse, { symbol: string; period?: string }>({
      query: ({ symbol, period = "1M" }) => ({
        url: `/api/v1/public/market/stocks/${symbol}/trend`,
        params: { period },
      }),
      rawResponseSchema: apiResponseSchema(StockTrendResponseSchema),
      transformResponse: (response: ApiResponse<StockTrendResponse>) => response.data,
      transformErrorResponse: transformApiError,
    }),
  }),
});

export const { useSearchStocksQuery, useLazySearchStocksQuery, useGetStockTrendQuery } = stockApi;

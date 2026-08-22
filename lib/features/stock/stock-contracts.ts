import { z } from "zod";

export const StockSearchResponseSchema = z.object({
  name: z.string(),
  code: z.string(),
  symbol: z.string(),
  market: z.string(),
});

export type StockSearchResponse = z.infer<typeof StockSearchResponseSchema>;

export const TrendPointSchema = z.object({
  date: z.string(),
  price: z.number(),
});

export type TrendPoint = z.infer<typeof TrendPointSchema>;

export const StockTrendResponseSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  current: z.number(),
  changePct: z.number(),
  isOpen: z.boolean(),
  trendPoints: z.array(TrendPointSchema),
});

export type StockTrendResponse = z.infer<typeof StockTrendResponseSchema>;

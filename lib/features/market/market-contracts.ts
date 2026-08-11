import { z } from "zod";

export const MarketIndexResponseSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  current: z.number(),
  changePct: z.number(),
  sparkline: z.array(z.number()),
  isOpen: z.boolean(),
});

export type MarketIndexResponse = z.infer<typeof MarketIndexResponseSchema>;
export type MarketPeriod = "1D" | "1M" | "1Y" | "ALL";

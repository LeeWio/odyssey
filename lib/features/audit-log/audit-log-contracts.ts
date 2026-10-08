import { z } from "zod";

export const OperationLogSchema = z.object({
  id: z.number(),
  username: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  requestMethod: z.string().nullable().optional(),
  requestUrl: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  status: z.number().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  traceId: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

export type OperationLog = z.infer<typeof OperationLogSchema>;

export interface OperationLogQuery {
  username?: string;
  operation?: string;
  status?: number;
  page: number;
  size: number;
}

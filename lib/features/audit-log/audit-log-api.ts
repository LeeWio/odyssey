import type { ApiResponse, PageResult } from "@/lib/api";
import { apiResponseSchema, baseApi, pageResultSchema, transformApiError } from "@/lib/api";

import {
  OperationLogSchema,
  type OperationLog,
  type OperationLogQuery,
} from "./audit-log-contracts";

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOperationLogs: builder.query<PageResult<OperationLog>, OperationLogQuery>({
      query: ({ username, operation, status, page, size }) => ({
        url: "/api/v1/admin/logs",
        params: {
          username: username || undefined,
          operation: operation || undefined,
          status,
          page,
          size,
          sort: "createdAt,desc",
        },
      }),
      rawResponseSchema: apiResponseSchema(pageResultSchema(OperationLogSchema)),
      transformResponse: (response: ApiResponse<PageResult<OperationLog>>) => response.data,
      transformErrorResponse: transformApiError,
      providesTags: [{ type: "AuditLog", id: "LIST" }],
    }),
  }),
});

export const { useGetOperationLogsQuery } = auditLogApi;

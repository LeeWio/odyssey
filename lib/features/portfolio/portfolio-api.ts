import { toast } from "@heroui/react";
import { z } from "zod";
import type { ApiResponse } from "@/types";
import { ApiResponseSchema, baseApi, transformError } from "../api/base-api";

/**
 * --- Zod Schemas for Runtime Validation ---
 */
export const TransactionResponseSchema = z.object({
  id: z.number(),
  ticker: z.string(),
  companyName: z.string(),
  action: z.enum(["BUY", "SELL"]),
  roi: z.string(),
  shares: z.string(),
  price: z.string(),
  statusText: z.string(),
  isHolding: z.boolean(),
  gradient: z.string().nullable().default(""),
});

export const TransactionRequestSchema = z.object({
  ticker: z.string(),
  companyName: z.string(),
  action: z.enum(["BUY", "SELL"]),
  roi: z.string(),
  shares: z.string(),
  price: z.string(),
  statusText: z.string(),
  isHolding: z.boolean(),
  gradient: z.string().optional().default(""),
});

export const KpiResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  value: z.string(),
  change: z.string(),
  percentage: z.string(),
  isPositive: z.boolean(),
  description: z.string(),
  bgStyle: z.string().nullable().default(""),
  glowStyle: z.string().nullable().default(""),
});

export const KpiRequestSchema = z.object({
  title: z.string(),
  value: z.string(),
  change: z.string(),
  percentage: z.string(),
  isPositive: z.boolean(),
  description: z.string(),
  bgStyle: z.string().optional().default(""),
  glowStyle: z.string().optional().default(""),
});

export const RuleResponseSchema = z.object({
  id: z.number(),
  rule: z.string(),
  desc: z.string(),
});

export const RuleRequestSchema = z.object({
  rule: z.string(),
  desc: z.string(),
});

export const ThesisResponseSchema = z.object({
  id: z.number(),
  thesis: z.string(),
});

export const ThesisRequestSchema = z.object({
  thesis: z.string(),
});

/**
 * --- TypeScript Interfaces ---
 */
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type TransactionRequest = z.infer<typeof TransactionRequestSchema>;

export type KpiResponse = z.infer<typeof KpiResponseSchema>;
export type KpiRequest = z.infer<typeof KpiRequestSchema>;

export type RuleResponse = z.infer<typeof RuleResponseSchema>;
export type RuleRequest = z.infer<typeof RuleRequestSchema>;

export type ThesisResponse = z.infer<typeof ThesisResponseSchema>;
export type ThesisRequest = z.infer<typeof ThesisRequestSchema>;

export const portfolioApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- Public Queries (for Blog / Portfolio view) ---
    getPublicTransactions: builder.query<TransactionResponse[], void>({
      query: () => "/api/v1/public/portfolio/transactions",
      rawResponseSchema: ApiResponseSchema(z.array(TransactionResponseSchema)),
      transformResponse: (response: ApiResponse<TransactionResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Portfolio" as const, id: `TX-${id}` })),
              { type: "Portfolio", id: "TX-LIST" },
            ]
          : [{ type: "Portfolio", id: "TX-LIST" }],
    }),

    getPublicKpis: builder.query<KpiResponse[], void>({
      query: () => "/api/v1/public/portfolio/kpis",
      rawResponseSchema: ApiResponseSchema(z.array(KpiResponseSchema)),
      transformResponse: (response: ApiResponse<KpiResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Portfolio" as const, id: `KPI-${id}` })),
              { type: "Portfolio", id: "KPI-LIST" },
            ]
          : [{ type: "Portfolio", id: "KPI-LIST" }],
    }),

    getPublicRules: builder.query<RuleResponse[], void>({
      query: () => "/api/v1/public/portfolio/rules",
      rawResponseSchema: ApiResponseSchema(z.array(RuleResponseSchema)),
      transformResponse: (response: ApiResponse<RuleResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Portfolio" as const, id: `RULE-${id}` })),
              { type: "Portfolio", id: "RULE-LIST" },
            ]
          : [{ type: "Portfolio", id: "RULE-LIST" }],
    }),

    getPublicThesis: builder.query<ThesisResponse, void>({
      query: () => "/api/v1/public/portfolio/thesis",
      rawResponseSchema: ApiResponseSchema(ThesisResponseSchema),
      transformResponse: (response: ApiResponse<ThesisResponse>) => response.data!,
      transformErrorResponse: transformError,
      providesTags: [{ type: "Portfolio", id: "THESIS" }],
    }),

    // --- Admin Queries/Mutations ---

    // Transactions
    getAdminTransactions: builder.query<TransactionResponse[], void>({
      query: () => "/api/v1/admin/portfolio/transactions",
      rawResponseSchema: ApiResponseSchema(z.array(TransactionResponseSchema)),
      transformResponse: (response: ApiResponse<TransactionResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Portfolio" as const, id: `TX-${id}` })),
              { type: "Portfolio", id: "TX-LIST" },
            ]
          : [{ type: "Portfolio", id: "TX-LIST" }],
    }),

    createTransaction: builder.mutation<TransactionResponse, TransactionRequest>({
      query: (body) => ({
        url: "/api/v1/admin/portfolio/transactions",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(TransactionResponseSchema),
      transformResponse: (response: ApiResponse<TransactionResponse>) => response.data!,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Transaction created successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to create transaction");
        }
      },
      invalidatesTags: [{ type: "Portfolio", id: "TX-LIST" }],
    }),

    updateTransaction: builder.mutation<
      TransactionResponse,
      { id: number; body: TransactionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/portfolio/transactions/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(TransactionResponseSchema),
      transformResponse: (response: ApiResponse<TransactionResponse>) => response.data!,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Transaction updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update transaction");
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Portfolio", id: `TX-${id}` },
        { type: "Portfolio", id: "TX-LIST" },
      ],
    }),

    deleteTransaction: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/portfolio/transactions/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Transaction deleted successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to delete transaction");
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "Portfolio", id: `TX-${id}` },
        { type: "Portfolio", id: "TX-LIST" },
      ],
    }),

    // KPIs
    getAdminKpis: builder.query<KpiResponse[], void>({
      query: () => "/api/v1/admin/portfolio/kpis",
      rawResponseSchema: ApiResponseSchema(z.array(KpiResponseSchema)),
      transformResponse: (response: ApiResponse<KpiResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Portfolio" as const, id: `KPI-${id}` })),
              { type: "Portfolio", id: "KPI-LIST" },
            ]
          : [{ type: "Portfolio", id: "KPI-LIST" }],
    }),

    updateKpi: builder.mutation<KpiResponse, { id: number; body: KpiRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/portfolio/kpis/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(KpiResponseSchema),
      transformResponse: (response: ApiResponse<KpiResponse>) => response.data!,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("KPI updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update KPI");
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Portfolio", id: `KPI-${id}` },
        { type: "Portfolio", id: "KPI-LIST" },
      ],
    }),

    // Rules
    getAdminRules: builder.query<RuleResponse[], void>({
      query: () => "/api/v1/admin/portfolio/rules",
      rawResponseSchema: ApiResponseSchema(z.array(RuleResponseSchema)),
      transformResponse: (response: ApiResponse<RuleResponse[]>) => response.data || [],
      transformErrorResponse: transformError,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Portfolio" as const, id: `RULE-${id}` })),
              { type: "Portfolio", id: "RULE-LIST" },
            ]
          : [{ type: "Portfolio", id: "RULE-LIST" }],
    }),

    createRule: builder.mutation<RuleResponse, RuleRequest>({
      query: (body) => ({
        url: "/api/v1/admin/portfolio/rules",
        method: "POST",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(RuleResponseSchema),
      transformResponse: (response: ApiResponse<RuleResponse>) => response.data!,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Trading rule created successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to create rule");
        }
      },
      invalidatesTags: [{ type: "Portfolio", id: "RULE-LIST" }],
    }),

    updateRule: builder.mutation<RuleResponse, { id: number; body: RuleRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/portfolio/rules/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(RuleResponseSchema),
      transformResponse: (response: ApiResponse<RuleResponse>) => response.data!,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Trading rule updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update rule");
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Portfolio", id: `RULE-${id}` },
        { type: "Portfolio", id: "RULE-LIST" },
      ],
    }),

    deleteRule: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/v1/admin/portfolio/rules/${id}`,
        method: "DELETE",
      }),
      rawResponseSchema: ApiResponseSchema(z.unknown()),
      transformResponse: (response: ApiResponse<void>) => response.data,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Trading rule deleted successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to delete rule");
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: "Portfolio", id: `RULE-${id}` },
        { type: "Portfolio", id: "RULE-LIST" },
      ],
    }),

    // Thesis
    getAdminThesis: builder.query<ThesisResponse, void>({
      query: () => "/api/v1/admin/portfolio/thesis",
      rawResponseSchema: ApiResponseSchema(ThesisResponseSchema),
      transformResponse: (response: ApiResponse<ThesisResponse>) => response.data!,
      transformErrorResponse: transformError,
      providesTags: [{ type: "Portfolio", id: "THESIS" }],
    }),

    updateThesis: builder.mutation<ThesisResponse, { id: number; body: ThesisRequest }>({
      query: ({ id, body }) => ({
        url: `/api/v1/admin/portfolio/thesis/${id}`,
        method: "PUT",
        body,
      }),
      rawResponseSchema: ApiResponseSchema(ThesisResponseSchema),
      transformResponse: (response: ApiResponse<ThesisResponse>) => response.data!,
      transformErrorResponse: transformError,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success("Market thesis updated successfully!");
        } catch (error) {
          toast.danger(typeof error === "string" ? error : "Failed to update market thesis");
        }
      },
      invalidatesTags: [{ type: "Portfolio", id: "THESIS" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPublicTransactionsQuery,
  useGetPublicKpisQuery,
  useGetPublicRulesQuery,
  useGetPublicThesisQuery,
  useGetAdminTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useGetAdminKpisQuery,
  useUpdateKpiMutation,
  useGetAdminRulesQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,
  useGetAdminThesisQuery,
  useUpdateThesisMutation,
} = portfolioApi;

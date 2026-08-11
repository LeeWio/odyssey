import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export interface ApiErrorPayload {
  code?: number;
  message?: string;
  traceId?: string;
}

export const getApiErrorPayload = (error: unknown): ApiErrorPayload | undefined => {
  if (!error || typeof error !== "object") return undefined;

  const value = error as { data?: unknown };
  const candidate = value.data ?? error;
  if (!candidate || typeof candidate !== "object") return undefined;

  const payload = candidate as Record<string, unknown>;
  return {
    code: typeof payload.code === "number" ? payload.code : undefined,
    message: typeof payload.message === "string" ? payload.message : undefined,
    traceId: typeof payload.traceId === "string" ? payload.traceId : undefined,
  };
};

export const transformApiError = (error: FetchBaseQueryError): string => {
  const payload = getApiErrorPayload(error);
  if (payload?.message) return payload.message;

  switch (error.status) {
    case 400:
      return "Invalid request.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "Access denied. Action not permitted.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "The request conflicts with the current resource state.";
    case 413:
      return "File too large. Please upload a smaller file.";
    case 422:
      return "The request could not be processed.";
    case 429:
      return "Too many requests. Please slow down and try again later.";
    case "FETCH_ERROR":
      return "Network error. Please check your connection.";
    case "PARSING_ERROR":
      return "Invalid server response.";
    case "TIMEOUT_ERROR":
      return "Request timed out. Please try again.";
    case "CUSTOM_ERROR":
      return error.error || "Request failed.";
    default:
      return "An unexpected error occurred.";
  }
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string") return error;
  return getApiErrorPayload(error)?.message ?? fallback;
};

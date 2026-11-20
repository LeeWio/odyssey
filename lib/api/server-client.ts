import { z } from "zod";
import { type AppLocale } from "@/i18n/locale";
import { localizeApiPayload } from "@/lib/i18n/api-localization";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import { getServerApiOrigin, joinApiPath } from "./api-config";
import { SERVER_PREFETCH_HEADER } from "./client-device";
import { apiResponseSchema } from "./contracts";
import { createApiError, getApiErrorPayload, type NormalizedApiError } from "./errors";

const DEFAULT_TIMEOUT_MS = 3_000;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export interface ServerApiFetchOptions {
  accept?: string;
  cache?: RequestCache;
  expectedContentType?: string;
  localize?: boolean;
  locale?: AppLocale;
  revalidate?: number;
  tags?: readonly string[];
  timeoutMs?: number;
}

export interface ServerApiResult<T> {
  data: T | null;
  error?: NormalizedApiError;
  status: number;
}

function serverApiUrl(path: string): string | null {
  const origin = getServerApiOrigin();
  if (!origin) return null;
  return joinApiPath(origin, path);
}

interface ServerApiResponse {
  response: Response | null;
  error?: NormalizedApiError;
  locale?: AppLocale;
  status: number;
}

async function requestServerApi(
  path: string,
  options: ServerApiFetchOptions
): Promise<ServerApiResponse> {
  const url = serverApiUrl(path);
  if (!url) {
    return { response: null, error: createApiError("FETCH_ERROR"), status: 0 };
  }

  try {
    let locale = options.locale;
    if (!locale) {
      try {
        locale = await getRequestLocale();
      } catch {
        locale = undefined;
      }
    }
    const headers: Record<string, string> = {
      accept: options.accept ?? "application/json",
      [SERVER_PREFETCH_HEADER]: "1",
    };
    if (locale) headers["accept-language"] = locale;
    const init: NextFetchInit = {
      headers,
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    };

    if (options.cache) init.cache = options.cache;
    if (options.revalidate !== undefined || options.tags?.length) {
      init.next = {
        ...(options.revalidate === undefined ? {} : { revalidate: options.revalidate }),
        ...(options.tags?.length ? { tags: [...options.tags] } : {}),
      };
    }

    const response = await fetch(url, init);
    return { response, locale, status: response.status };
  } catch (error) {
    const status =
      error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT_ERROR" : "FETCH_ERROR";
    return { response: null, error: createApiError(status), status: 0 };
  }
}

async function readServerApiError(response: Response): Promise<NormalizedApiError> {
  let errorPayload;
  try {
    errorPayload = getApiErrorPayload(await response.json());
  } catch {
    errorPayload = undefined;
  }
  return createApiError(response.status, errorPayload);
}

export async function fetchServerApiJson<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ServerApiFetchOptions = {}
): Promise<ServerApiResult<T>> {
  const result = await requestServerApi(path, options);
  if (!result.response) return { data: null, error: result.error, status: result.status };
  if (!result.response.ok) {
    return {
      data: null,
      error: await readServerApiError(result.response),
      status: result.status,
    };
  }

  let payload: unknown;
  try {
    payload = await result.response.json();
  } catch {
    return {
      data: null,
      error: createApiError("PARSING_ERROR"),
      status: result.status,
    };
  }
  const parsed = apiResponseSchema(schema).safeParse(
    options.localize === false ? payload : localizeApiPayload(payload, result.locale)
  );

  if (!parsed.success) {
    return {
      data: null,
      error: createApiError("PARSING_ERROR"),
      status: result.status,
    };
  }

  return { data: parsed.data.data, status: result.status };
}

export async function fetchServerApiText(
  path: string,
  options: ServerApiFetchOptions = {}
): Promise<ServerApiResult<string>> {
  const result = await requestServerApi(path, {
    ...options,
    accept: options.accept ?? "text/plain",
    localize: false,
  });
  if (!result.response) return { data: null, error: result.error, status: result.status };
  if (!result.response.ok) {
    return {
      data: null,
      error: await readServerApiError(result.response),
      status: result.status,
    };
  }
  if (
    options.expectedContentType &&
    !result.response.headers.get("content-type")?.includes(options.expectedContentType)
  ) {
    return {
      data: null,
      error: createApiError("PARSING_ERROR"),
      status: result.status,
    };
  }

  try {
    return { data: await result.response.text(), status: result.status };
  } catch {
    return {
      data: null,
      error: createApiError("PARSING_ERROR"),
      status: result.status,
    };
  }
}

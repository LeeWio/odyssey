import { z } from "zod";
import { type AppLocale } from "@/i18n/locale";
import { localizeApiPayload } from "@/lib/i18n/api-localization";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import { getServerApiOrigin, joinApiPath } from "./api-config";
import { SERVER_PREFETCH_HEADER } from "./client-device";
import { apiResponseSchema } from "./contracts";

const DEFAULT_TIMEOUT_MS = 3_000;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export interface ServerApiFetchOptions {
  cache?: RequestCache;
  localize?: boolean;
  locale?: AppLocale;
  revalidate?: number;
  tags?: readonly string[];
  timeoutMs?: number;
}

export interface ServerApiResult<T> {
  data: T | null;
  status: number;
}

function serverApiUrl(path: string): string | null {
  const origin = getServerApiOrigin();
  if (!origin) return null;
  return joinApiPath(origin, path);
}

export async function fetchServerApiJson<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ServerApiFetchOptions = {}
): Promise<ServerApiResult<T>> {
  const url = serverApiUrl(path);
  if (!url) return { data: null, status: 0 };

  try {
    let locale = options.locale;
    if (!locale) {
      try {
        locale = await getRequestLocale();
      } catch {
        locale = undefined;
      }
    }
    const headers: Record<string, string> = { [SERVER_PREFETCH_HEADER]: "1" };
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
    if (!response.ok) return { data: null, status: response.status };

    const payload: unknown = await response.json();
    const parsed = apiResponseSchema(schema).safeParse(
      options.localize === false ? payload : localizeApiPayload(payload, locale)
    );

    return {
      data: parsed.success ? parsed.data.data : null,
      status: response.status,
    };
  } catch {
    return { data: null, status: 0 };
  }
}

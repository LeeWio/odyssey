import { z } from "zod";
import { headers } from "next/headers";

import { SERVER_PREFETCH_HEADER } from "@/lib/api/client-device";
import { apiResponseSchema } from "@/lib/api";
import { resolveAppLocale, type AppLocale } from "@/i18n/locale";
import { localizeApiPayload } from "@/lib/i18n/api-localization";

import {
  LifeListCategoryResponseSchema,
  LifeListItemResponseSchema,
  LifeListPageResponseSchema,
  type LifeListCategoryResponse,
  type LifeListItemResponse,
  type LifeListPageResponse,
} from "./life-list-contracts";

const REVALIDATE_SECONDS = 60;

function apiOrigin() {
  const configured =
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "development" ? "http://127.0.0.1:8080" : null;
}

async function readPublicData<T>(
  url: string,
  schema: z.ZodType<T>,
  locale: AppLocale
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { [SERVER_PREFETCH_HEADER]: "1", "accept-language": locale },
      signal: AbortSignal.timeout(3_000),
      next: { revalidate: REVALIDATE_SECONDS, tags: ["public-life-list"] },
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    const parsed = apiResponseSchema(schema).safeParse(localizeApiPayload(payload, locale));
    return parsed.success ? (parsed.data.data as T) : null;
  } catch {
    return null;
  }
}

export interface PublicLifeListInitialData {
  page: LifeListPageResponse | null;
  categories: LifeListCategoryResponse[];
}

export async function getPublicLifeListInitialData(): Promise<PublicLifeListInitialData> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return { page: null, categories: [] };
  }
  const origin = apiOrigin();
  if (!origin) return { page: null, categories: [] };
  const locale = resolveAppLocale((await headers()).get("accept-language"));

  const [page, categories] = await Promise.all([
    readPublicData(
      `${origin}/api/v1/public/life-list?page=0&size=100`,
      LifeListPageResponseSchema,
      locale
    ),
    readPublicData(
      `${origin}/api/v1/public/life-list/categories`,
      z.array(LifeListCategoryResponseSchema),
      locale
    ),
  ]);

  return { page, categories: categories ?? [] };
}

export async function getPublicLifeListItem(number: number): Promise<LifeListItemResponse | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const origin = apiOrigin();
  if (!origin) return null;
  const locale = resolveAppLocale((await headers()).get("accept-language"));
  return readPublicData(
    `${origin}/api/v1/public/life-list/${number}`,
    LifeListItemResponseSchema,
    locale
  );
}

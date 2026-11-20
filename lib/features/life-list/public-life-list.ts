import { z } from "zod";

import { fetchServerApiJson } from "@/lib/api/server-client";
import { type AppLocale } from "@/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import {
  LifeListCategoryResponseSchema,
  LifeListItemResponseSchema,
  LifeListPageResponseSchema,
  type LifeListCategoryResponse,
  type LifeListItemResponse,
  type LifeListPageResponse,
} from "./life-list-contracts";

const REVALIDATE_SECONDS = 60;

async function readPublicData<T>(
  path: string,
  schema: z.ZodType<T>,
  locale: AppLocale
): Promise<T | null> {
  return (
    await fetchServerApiJson(path, schema, {
      locale,
      revalidate: REVALIDATE_SECONDS,
      tags: ["public-life-list"],
    })
  ).data;
}

export interface PublicLifeListInitialData {
  page: LifeListPageResponse | null;
  categories: LifeListCategoryResponse[];
}

export async function getPublicLifeListInitialData(): Promise<PublicLifeListInitialData> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return { page: null, categories: [] };
  }
  const locale = await getRequestLocale();

  const [page, categories] = await Promise.all([
    readPublicData("/api/v1/public/life-list?page=0&size=100", LifeListPageResponseSchema, locale),
    readPublicData(
      "/api/v1/public/life-list/categories",
      z.array(LifeListCategoryResponseSchema),
      locale
    ),
  ]);

  return { page, categories: categories ?? [] };
}

export async function getPublicLifeListItem(number: number): Promise<LifeListItemResponse | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const locale = await getRequestLocale();
  return readPublicData(`/api/v1/public/life-list/${number}`, LifeListItemResponseSchema, locale);
}

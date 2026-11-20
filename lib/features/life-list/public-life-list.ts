import { z } from "zod";

import { fetchServerApiJson } from "@/lib/api/server-client";

import {
  LifeListCategoryResponseSchema,
  LifeListItemResponseSchema,
  LifeListPageResponseSchema,
  type LifeListCategoryResponse,
  type LifeListItemResponse,
  type LifeListPageResponse,
} from "./life-list-contracts";

const REVALIDATE_SECONDS = 60;

async function readPublicData<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  return (
    await fetchServerApiJson(path, schema, {
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
  const [page, categories] = await Promise.all([
    readPublicData("/api/v1/public/life-list?page=0&size=100", LifeListPageResponseSchema),
    readPublicData("/api/v1/public/life-list/categories", z.array(LifeListCategoryResponseSchema)),
  ]);

  return { page, categories: categories ?? [] };
}

export async function getPublicLifeListItem(number: number): Promise<LifeListItemResponse | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  return readPublicData(`/api/v1/public/life-list/${number}`, LifeListItemResponseSchema);
}

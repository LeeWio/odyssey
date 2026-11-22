import { z } from "zod";

import { appendApiParams, pageResultSchema, type PageResult } from "@/lib/api";
import { fetchServerApiJson } from "@/lib/api/server-client";

import { MomentResponseSchema, type MomentResponse } from "./moment-contracts";

async function readPublicData<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  return (await fetchServerApiJson(path, schema, { cache: "no-store" })).data;
}

export function getPublicMoment(id: number) {
  return fetchServerApiJson(`/api/v1/public/moments/${id}`, MomentResponseSchema, {
    cache: "no-store",
  });
}

export async function getPublicMomentsInitialPage(
  size = 12,
  page = 1,
  topic?: string
): Promise<PageResult<MomentResponse> | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const path = appendApiParams("/api/v1/public/moments", {
    page: requestedPage - 1,
    size,
    topic,
  });

  return readPublicData(path, pageResultSchema(MomentResponseSchema));
}

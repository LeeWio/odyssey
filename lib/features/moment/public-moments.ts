import { z } from "zod";

import type { PageResult } from "@/lib/api";
import { pageResultSchema } from "@/lib/api";
import { fetchServerApiJson } from "@/lib/api/server-client";

import {
  MomentCadenceResponseSchema,
  MomentResponseSchema,
  type MomentCadenceResponse,
  type MomentResponse,
} from "./moment-contracts";

export interface PublicMomentsInitialData {
  page: PageResult<MomentResponse> | null;
  cadence: MomentCadenceResponse | null;
}

async function readPublicData<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  return (await fetchServerApiJson(path, schema, { cache: "no-store" })).data;
}

export async function getPublicMomentsInitialData(
  size = 12,
  page = 1,
  topic?: string
): Promise<PublicMomentsInitialData> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return { page: null, cadence: null };
  }

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const query = new URLSearchParams({ page: String(requestedPage - 1), size: String(size) });
  if (topic) query.set("topic", topic);

  const [momentsPage, cadence] = await Promise.all([
    readPublicData(
      `/api/v1/public/moments?${query.toString()}`,
      pageResultSchema(MomentResponseSchema)
    ),
    readPublicData(`/api/v1/public/moments/cadence`, MomentCadenceResponseSchema),
  ]);

  return { page: momentsPage, cadence };
}

export async function getPublicMomentsInitialPage(): Promise<PageResult<MomentResponse> | null> {
  return (await getPublicMomentsInitialData()).page;
}

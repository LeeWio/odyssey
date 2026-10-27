import { z } from "zod";

import type { PageResult } from "@/lib/api";
import { SERVER_PREFETCH_HEADER } from "@/lib/api/client-device";
import { apiResponseSchema, pageResultSchema } from "@/lib/api";

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

function apiOrigin() {
  const configured =
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "development" ? "http://127.0.0.1:8080" : null;
}

async function readPublicData<T>(url: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { [SERVER_PREFETCH_HEADER]: "1" },
      signal: AbortSignal.timeout(3_000),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload: unknown = await response.json();
    const parsed = apiResponseSchema(schema).safeParse(payload);
    return parsed.success ? (parsed.data.data as T) : null;
  } catch {
    return null;
  }
}

export async function getPublicMomentsInitialData(size = 12): Promise<PublicMomentsInitialData> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return { page: null, cadence: null };
  }

  const origin = apiOrigin();
  if (!origin) return { page: null, cadence: null };

  const [page, cadence] = await Promise.all([
    readPublicData(
      `${origin}/api/v1/public/moments?page=0&size=${size}`,
      pageResultSchema(MomentResponseSchema)
    ),
    readPublicData(`${origin}/api/v1/public/moments/cadence`, MomentCadenceResponseSchema),
  ]);

  return { page, cadence };
}

export async function getPublicMomentsInitialPage(): Promise<PageResult<MomentResponse> | null> {
  return (await getPublicMomentsInitialData()).page;
}

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

export async function getPublicMomentsInitialData(
  size = 12,
  page = 1,
  topic?: string
): Promise<PublicMomentsInitialData> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return { page: null, cadence: null };
  }

  const origin = apiOrigin();
  if (!origin) return { page: null, cadence: null };

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const query = new URLSearchParams({ page: String(requestedPage - 1), size: String(size) });
  if (topic) query.set("topic", topic);

  const [momentsPage, cadence] = await Promise.all([
    readPublicData(
      `${origin}/api/v1/public/moments?${query.toString()}`,
      pageResultSchema(MomentResponseSchema)
    ),
    readPublicData(`${origin}/api/v1/public/moments/cadence`, MomentCadenceResponseSchema),
  ]);

  return { page: momentsPage, cadence };
}

export async function getPublicMomentsInitialPage(): Promise<PageResult<MomentResponse> | null> {
  return (await getPublicMomentsInitialData()).page;
}

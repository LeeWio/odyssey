import { z } from "zod";

import type { PageResult } from "@/lib/api";
import { apiResponseSchema, pageResultSchema } from "@/lib/api";

import { PostDigestResponseSchema, type PostDigestResponse } from "./post-contracts";

const JOURNAL_REVALIDATE_SECONDS = 60;

export interface PublicJournalInitialData {
  featured: PageResult<PostDigestResponse> | null;
  latest: PageResult<PostDigestResponse> | null;
}

function apiOrigin() {
  const configured =
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "development" ? "http://127.0.0.1:8080" : null;
}

async function readPage<T>(url: string, schema: z.ZodType<T>) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3_000),
      next: { revalidate: JOURNAL_REVALIDATE_SECONDS, tags: ["public-journal"] },
    });
    if (!response.ok) return null;

    const payload: unknown = await response.json();
    const parsed = apiResponseSchema(schema).safeParse(payload);
    return parsed.success ? parsed.data.data : null;
  } catch {
    return null;
  }
}

export async function getPublicJournalInitialData(): Promise<PublicJournalInitialData> {
  const origin = apiOrigin();
  if (!origin) return { featured: null, latest: null };

  const [featured, latest] = await Promise.all([
    readPage(
      `${origin}/api/v1/public/blog/posts/featured?page=0&size=8`,
      pageResultSchema(PostDigestResponseSchema)
    ),
    readPage(
      `${origin}/api/v1/public/blog/posts/digest?page=0&size=12`,
      pageResultSchema(PostDigestResponseSchema)
    ),
  ]);

  return { featured, latest };
}

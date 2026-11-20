import { z } from "zod";

import type { PageResult } from "@/lib/api";
import { SERVER_PREFETCH_HEADER } from "@/lib/api/client-device";
import { apiResponseSchema, pageResultSchema } from "@/lib/api";

import { PostDigestResponseSchema, type PostDigestResponse } from "./post-contracts";
import { type AppLocale } from "@/i18n/locale";
import { localizeApiPayload } from "@/lib/i18n/api-localization";
import { getRequestLocale } from "@/lib/i18n/request-locale";

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

async function readPage<T>(url: string, schema: z.ZodType<T>, locale: AppLocale) {
  try {
    const response = await fetch(url, {
      headers: { [SERVER_PREFETCH_HEADER]: "1", "accept-language": locale },
      signal: AbortSignal.timeout(3_000),
      next: { revalidate: JOURNAL_REVALIDATE_SECONDS, tags: ["public-journal"] },
    });
    if (!response.ok) return null;

    const payload: unknown = await response.json();
    const parsed = apiResponseSchema(schema).safeParse(localizeApiPayload(payload, locale));
    return parsed.success ? parsed.data.data : null;
  } catch {
    return null;
  }
}

export async function getPublicJournalInitialData({
  featuredSize = 8,
  latestSize = 12,
}: {
  featuredSize?: number;
  latestSize?: number;
} = {}): Promise<PublicJournalInitialData> {
  const origin = apiOrigin();
  if (!origin) return { featured: null, latest: null };
  const locale = await getRequestLocale();

  const [featured, latest] = await Promise.all([
    readPage(
      `${origin}/api/v1/public/blog/posts/featured?page=0&size=${featuredSize}`,
      pageResultSchema(PostDigestResponseSchema),
      locale
    ),
    readPage(
      `${origin}/api/v1/public/blog/posts/digest?page=0&size=${latestSize}`,
      pageResultSchema(PostDigestResponseSchema),
      locale
    ),
  ]);

  return { featured, latest };
}

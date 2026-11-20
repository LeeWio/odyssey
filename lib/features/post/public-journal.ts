import { z } from "zod";

import { appendApiParams, pageResultSchema, type PageResult } from "@/lib/api";
import { fetchServerApiJson } from "@/lib/api/server-client";
import type { AppLocale } from "@/i18n/locale";

import { PostDigestResponseSchema, type PostDigestResponse } from "./post-contracts";

const JOURNAL_REVALIDATE_SECONDS = 60;

export interface PublicJournalInitialData {
  featured: PageResult<PostDigestResponse> | null;
  latest: PageResult<PostDigestResponse> | null;
}

async function readPage<T>(url: string, schema: z.ZodType<T>, locale?: AppLocale) {
  return (
    await fetchServerApiJson(url, schema, {
      locale,
      revalidate: JOURNAL_REVALIDATE_SECONDS,
      tags: ["public-journal"],
    })
  ).data;
}

export async function getPublicJournalInitialData({
  featuredSize = 8,
  latestSize = 12,
}: {
  featuredSize?: number;
  latestSize?: number;
} = {}): Promise<PublicJournalInitialData> {
  const [featured, latest] = await Promise.all([
    readPage(
      appendApiParams("/api/v1/public/blog/posts/featured", { page: 0, size: featuredSize }),
      pageResultSchema(PostDigestResponseSchema)
    ),
    readPage(
      appendApiParams("/api/v1/public/blog/posts/digest", { page: 0, size: latestSize }),
      pageResultSchema(PostDigestResponseSchema)
    ),
  ]);

  return { featured, latest };
}

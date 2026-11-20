import { z } from "zod";
import { siteConfig } from "@/config/site";
import { appendApiParams } from "@/lib/api";
import { fetchServerApiJson } from "@/lib/api/server-client";

interface FeedPost {
  title: string;
  slug: string;
  summary?: string | null;
  publishedAt?: string | null;
}

const feedPostsSchema = z.object({
  list: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      summary: z.string().nullable().optional(),
      publishedAt: z.string().nullable().optional(),
    })
  ),
});

const escapeXml = (value: string) =>
  value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };

    return entities[character];
  });

const getCanonicalOrigin = (request: Request) => {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configuredOrigin) return configuredOrigin;

  // Proxies can expose their internal host through request.url. Use the public
  // site URL by default so feed consumers never receive container addresses.
  return siteConfig.url || new URL(request.url).origin;
};

const toPublishedDate = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toUTCString();
};

export async function GET(request: Request) {
  const origin = getCanonicalOrigin(request);
  const result = await fetchServerApiJson(
    appendApiParams("/api/v1/public/blog/posts", { page: 0, size: 50 }),
    feedPostsSchema,
    { locale: "en", revalidate: 3600 }
  );
  const posts: FeedPost[] = result.data?.list ?? [];

  const items = posts
    .map((post) => {
      const url = new URL(`/single/${encodeURIComponent(post.slug)}`, `${origin}/`).toString();
      const publishedAt = toPublishedDate(post.publishedAt);

      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
        post.summary ? `<description>${escapeXml(post.summary)}</description>` : "",
        publishedAt ? `<pubDate>${publishedAt}</pubDate>` : "",
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${escapeXml(origin)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(`${origin}/rss.xml`)}" rel="self" type="application/rss+xml" />
    <generator>Odyssey RSS</generator>
    <ttl>60</ttl>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

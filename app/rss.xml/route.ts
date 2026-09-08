import { siteConfig } from "@/config/site";

interface FeedPost {
  title: string;
  slug: string;
  summary?: string | null;
  publishedAt?: string | null;
}

interface PostsResponse {
  data?: {
    list?: FeedPost[];
  };
}

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

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const apiOrigin =
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    origin;
  let posts: FeedPost[] = [];

  try {
    const response = await fetch(`${apiOrigin}/api/v1/public/blog/posts?page=0&size=50`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const payload = (await response.json()) as PostsResponse;
      posts = payload.data?.list ?? [];
    }
  } catch {
    // Keep the feed valid while the content API is temporarily unavailable.
  }

  const items = posts
    .map((post) => {
      const url = `${origin}/single/${encodeURIComponent(post.slug)}`;
      const publishedAt = post.publishedAt ? new Date(post.publishedAt).toUTCString() : undefined;

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
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${escapeXml(origin)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
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

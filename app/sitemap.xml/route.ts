import { siteConfig } from "@/config/site";

export async function GET() {
  const apiOrigin = process.env.API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || siteConfig.url;
  const url = new URL("/api/v1/public/seo/sitemap.xml", apiOrigin);

  try {
    const sitemap = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (sitemap.ok && sitemap.headers.get("content-type")?.includes("xml")) {
      return new Response(sitemap.body, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=0, s-maxage=300",
        },
      });
    }
  } catch {
    // Return a retryable status when the content service is unreachable.
  }

  return new Response("Sitemap temporarily unavailable", {
    status: 503,
    headers: { "Cache-Control": "no-store", "Retry-After": "60" },
  });
}

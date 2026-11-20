import { fetchServerApiText } from "@/lib/api/server-client";

export async function GET() {
  const result = await fetchServerApiText("/api/v1/public/seo/sitemap.xml", {
    accept: "application/xml",
    expectedContentType: "xml",
    revalidate: 300,
    timeoutMs: 8_000,
  });

  if (result.data) {
    return new Response(result.data, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=300",
      },
    });
  }

  return new Response("Sitemap temporarily unavailable", {
    status: 503,
    headers: { "Cache-Control": "no-store", "Retry-After": "60" },
  });
}

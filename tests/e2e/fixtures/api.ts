import { createServer } from "node:http";

import { articles, designArticle } from "./articles";
import { featured, stories } from "./journal";

const origin = new URL(process.env.E2E_FIXTURE_ORIGIN ?? "http://127.0.0.1:3181");
const blogPosts = "/api/v1/public/blog/posts";
const analyticsPageviews = "/api/v1/public/analytics/pageviews";

createServer((request, response) => {
  const url = new URL(request.url ?? "/", origin);
  const { pathname } = url;
  const send = (status: number, data: unknown = null) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({ code: status, message: status === 200 ? "OK" : "Fixture unavailable", data })
    );
  };

  if (request.method === "POST" && pathname === analyticsPageviews) return send(200);
  if (request.method !== "GET") return send(405);
  if (pathname === "/api/v1/public/seo/sitemap.xml") {
    response.writeHead(200, { "Content-Type": "application/xml" });
    response.end(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://easylove.top/single/design-foundation</loc></url></urlset>'
    );
    return;
  }
  if (pathname === "/health") return send(200, { ready: true });
  if (pathname === "/api/v1/public/moments/809") {
    return send(200, {
      id: 809,
      content: "An older Moment opened directly from an email.",
      visibility: "public",
      authorName: "Fixture author",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
      likesCount: 0,
      commentsCount: 0,
      images: [],
      topics: [],
    });
  }
  if (
    pathname === blogPosts ||
    pathname === `${blogPosts}/featured` ||
    pathname === `${blogPosts}/digest`
  ) {
    const keyword = url.searchParams.get("keyword")?.toLowerCase();
    const categoryId = url.searchParams.get("categoryId");
    const page = Number(url.searchParams.get("page")) || 0;
    const size = Number(url.searchParams.get("size")) || 12;
    const pool = pathname.endsWith("/featured") ? featured : [...stories, designArticle];
    const matching = pool.filter(
      (post) =>
        (!keyword || `${post.title} ${post.slug}`.toLowerCase().includes(keyword)) &&
        (!categoryId || String(post.category?.id) === categoryId)
    );
    return send(200, {
      list: matching.slice(page * size, (page + 1) * size),
      total: matching.length,
      page,
      size,
      totalPages: Math.ceil(matching.length / size),
    });
  }
  if (pathname.startsWith(`${blogPosts}/`)) {
    const slug = pathname.slice(blogPosts.length + 1);
    if (slug.endsWith("/related")) return send(200, []);
    if (slug === "unavailable-article") return send(503);
    const article = articles.get(slug);
    return article ? send(200, article) : send(404);
  }
  return send(404);
}).listen(Number(origin.port), "127.0.0.1");

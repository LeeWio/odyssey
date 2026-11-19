import { createServer } from "node:http";

import { articles, designArticle } from "./articles";

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
  if (pathname === "/health") return send(200, { ready: true });
  if (pathname === `${blogPosts}/featured` || pathname === `${blogPosts}/digest`) {
    return send(200, {
      list: [designArticle],
      total: 1,
      page: 0,
      size: Number(url.searchParams.get("size")) || 12,
      totalPages: 1,
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

import { createServer } from "node:http";

import { articles, designArticle } from "./articles";
import { featured, journalFallbackPrefix, stories, story } from "./journal";

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
  if (pathname === "/api/v1/public/moments/809" || pathname === "/api/v1/public/moments/810") {
    const isPublic = pathname.endsWith("/809");
    return send(200, {
      id: isPublic ? 809 : 810,
      content: isPublic ? "An older Moment opened directly from an email." : "Private Moment.",
      visibility: isPublic ? "public" : "private",
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
    // These journeys exercise the journal's browser query after an SSR fetch fails.
    if (pathname.endsWith("/digest") && keyword?.startsWith(journalFallbackPrefix)) {
      return send(503);
    }
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
  if (pathname === "/api/v1/public/columns/understanding-max96781") {
    return send(200, {
      slug: "understanding-max96781",
      isPublished: true,
      postsCount: 9,
      posts: [{ ...story(47), slug: "max96781-automotive-display-overview" }],
    });
  }
  if (pathname.startsWith(`${blogPosts}/`)) {
    const slug = pathname.slice(blogPosts.length + 1);
    if (slug.endsWith("/related")) return send(200, []);
    if (slug === "unavailable-article") return send(503);
    if (slug === "sa8295p-display-architecture-features") {
      return send(200, { ...story(29), slug, readingTimeMinutes: 23 });
    }
    if (slug === "dp0-dp02") return send(200, { ...story(30), slug });
    if (slug === "memories-of-grandpa") {
      return send(200, {
        ...story(28),
        slug,
        readingTimeMinutes: 43,
        category: { ...story(28).category, slug: "loose-thoughts" },
      });
    }

    const article = articles.get(slug);
    return article ? send(200, article) : send(404);
  }
  return send(404);
}).listen(Number(origin.port), "127.0.0.1");

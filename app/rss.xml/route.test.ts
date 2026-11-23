import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const request = new Request("http://internal.test/rss.xml");
const post = { title: "Tips & notes", slug: "tips", summary: "<A summary>" };
const fetchUpstream = vi.fn<typeof fetch>();

const feedResponse = (list: (typeof post)[]) =>
  Response.json({ code: 200, message: "OK", data: { list } });

const parseItems = async (response: Response) => {
  const document = new DOMParser().parseFromString(await response.text(), "application/xml");
  expect(document.querySelector("parsererror")).toBeNull();
  expect(document.querySelector("rss channel")).not.toBeNull();
  return document.querySelectorAll("item");
};

beforeEach(() => {
  vi.stubEnv("API_URL", "https://api.example.test");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://odyssey.example.test/");
  fetchUpstream.mockReset();
  vi.stubGlobal("fetch", fetchUpstream);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /rss.xml", () => {
  it.each([
    { name: "a populated feed", posts: [post] },
    { name: "an empty feed", posts: [] },
  ])("serves and caches valid RSS for $name", async ({ posts }) => {
    fetchUpstream.mockResolvedValueOnce(feedResponse(posts));

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/rss+xml");
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=3600");
    const items = await parseItems(response);
    expect(items).toHaveLength(posts.length);
    if (posts.length) {
      expect(items[0].querySelector("title")?.textContent).toBe(post.title);
      expect(items[0].querySelector("link")?.textContent).toBe(
        "https://odyssey.example.test/single/tips"
      );
      expect(items[0].querySelector("description")?.textContent).toBe(post.summary);
    }
  });

  it.each([
    { name: "HTTP 503", upstream: async () => new Response(null, { status: 503 }) },
    {
      name: "a timeout",
      upstream: async () => {
        throw new DOMException("Request timed out", "TimeoutError");
      },
    },
    { name: "invalid JSON", upstream: async () => new Response("{") },
    {
      name: "an invalid payload",
      upstream: async () => Response.json({ code: 200, message: "OK", data: { list: null } }),
    },
  ])(
    "exposes a retryable failure for $name and serves RSS after recovery",
    async ({ upstream }) => {
      fetchUpstream.mockImplementationOnce(upstream).mockResolvedValueOnce(feedResponse([post]));

      const failure = await GET(request);
      expect(failure.status).toBe(503);
      expect(failure.headers.get("Cache-Control")).toBe("no-store");
      expect(failure.headers.get("Retry-After")).toBe("60");

      const response = await GET(request);
      expect(response.status).toBe(200);
      expect(await parseItems(response)).toHaveLength(1);
      expect(fetchUpstream.mock.calls.map(([, init]) => init?.cache)).toEqual([
        "no-store",
        "no-store",
      ]);
    }
  );
});

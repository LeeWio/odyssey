import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicMomentsInitialData } from "./public-moments";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("moment server prefetch", () => {
  it("fetches the URL's page and topic using zero-based API pagination", async () => {
    vi.stubEnv("API_URL", "https://api.example.test");
    const page = { list: [], page: 3, size: 12, total: 28, totalPages: 3 };
    const fetch = vi.fn(async (input: string) =>
      input.includes("/cadence")
        ? new Response(null, { status: 503 })
        : Response.json({ code: 200, message: "OK", data: page })
    );
    vi.stubGlobal("fetch", fetch);

    expect(await getPublicMomentsInitialData(12, 3, "daily & photos")).toEqual({
      page,
      cadence: null,
    });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("size")).toBe("12");
    expect(url.searchParams.get("topic")).toBe("daily & photos");
  });

  it("lets the client retry when server prefetch is unavailable", async () => {
    vi.stubEnv("API_URL", "https://api.example.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    expect(await getPublicMomentsInitialData()).toEqual({ page: null, cadence: null });
  });
});

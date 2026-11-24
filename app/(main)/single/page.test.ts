import { beforeEach, expect, it, vi } from "vitest";

import BlogIndexPage from "./page";
import { getJournalReadingPicks, getPublicJournalInitialData } from "@/lib/features/post/server";

vi.mock("@/features/blog/index/blog-index", () => ({ BlogIndex: () => null }));
vi.mock("@/lib/features/post/server", () => ({
  getJournalReadingPicks: vi.fn(),
  getPublicJournalInitialData: vi.fn(),
}));

const initialData = { featured: null, latest: null };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPublicJournalInitialData).mockResolvedValue(initialData);
});

it("returns the journal while the reading recommendations are pending", async () => {
  const pending = Promise.withResolvers<Awaited<ReturnType<typeof getJournalReadingPicks>>>();
  vi.mocked(getJournalReadingPicks).mockReturnValue(pending.promise);

  try {
    const page = await BlogIndexPage({ searchParams: Promise.resolve({}) });
    expect(page.props.initialData).toBe(initialData);
    expect(page.props.readingPicks).toBe(pending.promise);
  } finally {
    pending.resolve([]);
  }
});

it.each([{ q: "nexus" }, { category: "1" }, { page: "2" }])(
  "leaves recommendations out of the journal for %j",
  async (searchParams) => {
    const page = await BlogIndexPage({ searchParams: Promise.resolve(searchParams) });

    expect(page.props.initialData).toBe(initialData);
    expect(page.props.readingPicks).toBeNull();
    expect(getJournalReadingPicks).not.toHaveBeenCalled();
  }
);

import { parsePageParam } from "@/lib/utils/pagination";

export const JOURNAL_PAGE_SIZE = 12;

export function parseJournalQuery(get: (key: string) => string | null) {
  const category = Number(get("category"));
  return {
    keyword: get("q")?.trim() || undefined,
    categoryId: Number.isSafeInteger(category) && category > 0 ? category : undefined,
    page: parsePageParam(get("page")) - 1,
    size: JOURNAL_PAGE_SIZE,
  };
}

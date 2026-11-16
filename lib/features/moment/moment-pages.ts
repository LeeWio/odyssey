import type { PageResult } from "@/lib/api";
import type { MomentResponse } from "./moment-contracts";

export function reconcileMomentPage(
  page: PageResult<MomentResponse>,
  saved: MomentResponse,
  filter: { topic?: string } = {},
  publicOnly = true
): PageResult<MomentResponse> {
  if (!page.list.some(({ id }) => id === saved.id)) return page;
  const matches =
    (!publicOnly || saved.visibility === "public") &&
    (!filter.topic || saved.topics.some(({ slug }) => slug === filter.topic));
  const total = matches ? page.total : Math.max(0, page.total - 1);
  return {
    ...page,
    list: matches
      ? page.list.map((moment) => (moment.id === saved.id ? saved : moment))
      : page.list.filter(({ id }) => id !== saved.id),
    total,
    totalPages: Math.ceil(total / page.size),
  };
}

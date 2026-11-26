import type {
  LifeListCategoryResponse,
  LifeListItemResponse,
  LifeListPageResponse,
  LifeListStatus,
} from "../../../lib/features/life-list/life-list-contracts";

export const lifeListPath = "/api/v1/public/life-list";
const daily = { id: 1, name: "Daily life", slug: "daily", sortOrder: 0 };
const travel = { id: 2, name: "Travel", slug: "travel", sortOrder: 1 };
const creative = { id: 3, name: "Creative projects", slug: "creative", sortOrder: 2 };

export const lifeListCategories: LifeListCategoryResponse[] = [daily, travel, creative];

function wish(
  number: number,
  title: string,
  category: LifeListCategoryResponse,
  status: LifeListStatus
): LifeListItemResponse {
  return {
    id: number,
    number,
    title,
    category,
    status,
    visibility: "public",
    description: null,
    motivation: null,
    sortOrder: number,
    completedAt: null,
    archivedAt: null,
    memoryCount: 0,
    memories: [],
    createdAt: null,
    updatedAt: null,
  };
}

const wishes = [
  wish(1, "Plant a garden", daily, "planned"),
  wish(2, "Learn pottery", creative, "completed"),
];

export function lifeListFixture(params: URLSearchParams): LifeListPageResponse {
  const category = params.get("category");
  const status = params.get("status");
  const list = wishes.filter(
    (item) => (!category || item.category?.slug === category) && (!status || item.status === status)
  );

  return {
    list,
    total: list.length,
    page: 1,
    size: 100,
    totalPages: list.length ? 1 : 0,
    summary: { completed: 1, total: wishes.length, includesPrivate: false },
  };
}

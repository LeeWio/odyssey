export function parsePageParam(value: string | null, fallback = 1) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : fallback;
}

export function clampPageToTotal(page: number, totalPages: number) {
  const lastPage = Number.isSafeInteger(totalPages) && totalPages > 0 ? totalPages : 1;
  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  return Math.min(requestedPage, lastPage);
}

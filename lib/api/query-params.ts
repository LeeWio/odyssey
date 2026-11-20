export function serializeApiParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    if (key === "pageable" && typeof value === "object" && !Array.isArray(value)) {
      for (const [pageableKey, pageableValue] of Object.entries(value)) {
        if (pageableValue === undefined || pageableValue === null || pageableValue === "") {
          continue;
        }
        if (Array.isArray(pageableValue)) {
          pageableValue.forEach((item) => searchParams.append(pageableKey, String(item)));
        } else {
          searchParams.set(pageableKey, String(pageableValue));
        }
      }
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
    } else {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

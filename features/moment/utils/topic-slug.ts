export const MOMENT_TOPIC_LIMIT = 3;
export const MOMENT_TOPIC_SLUG_LIMIT = 80;

export const normalizeMomentTopicSlug = (value: string) => {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/^#+/u, "")
    .toLowerCase()
    .replace(/[\s_]+/gu, "-")
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, "-")
    .replace(/-{2,}/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return [...normalized].length <= MOMENT_TOPIC_SLUG_LIMIT ? normalized : "";
};

function normalizeOrigin(value: string | undefined): string | null {
  const normalized = value?.trim().replace(/\/$/, "");
  return normalized || null;
}

export function getClientApiOrigin(): string {
  return normalizeOrigin(process.env.NEXT_PUBLIC_API_BASE_URL) ?? "";
}

export function getServerApiOrigin(): string | null {
  return (
    normalizeOrigin(process.env.API_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_API_BASE_URL) ??
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8080" : null)
  );
}

export function joinApiPath(origin: string, path: string): string {
  return `${origin}/${path.replace(/^\//, "")}`;
}

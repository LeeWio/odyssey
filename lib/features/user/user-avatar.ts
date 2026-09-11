export function resolveStoredAvatar(avatar?: string | null): string | null {
  const value = avatar?.trim();
  return value ? value : null;
}

export async function emailAvatarUrl(email: string, size = 256): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return null;
  }
  const hash = await sha256Hex(normalized);
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type OAuthProvider = "google" | "github";

/** Providers the dialog can start. Labels stay proper nouns; button copy comes from i18n. */
export const SOCIAL_LOGIN_PROVIDERS: Array<{
  id: OAuthProvider;
  label: string;
  icon: string;
  enabled: boolean;
}> = [
  { id: "google", label: "Google", icon: "devicon:google", enabled: false },
  { id: "github", label: "GitHub", icon: "devicon:github", enabled: true },
];

export const OAUTH_REDIRECT_KEY = "oauth_redirect_referrer";

export const getOAuthAuthorizationUrl = (provider: OAuthProvider, apiBaseUrl?: string) => {
  const baseUrl = apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl.replace(/\/$/, "")}/oauth2/authorization/${provider}`;
};

export const startOAuthLogin = (provider: OAuthProvider) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    OAUTH_REDIRECT_KEY,
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  );
  window.location.assign(getOAuthAuthorizationUrl(provider, process.env.NEXT_PUBLIC_API_BASE_URL));
};

export const isSafeRedirectPath = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");

export const getSafeRedirectPath = (value: string | null | undefined) =>
  value && isSafeRedirectPath(value) ? value : "/";

const TOKEN_QUERY_KEYS = ["token", "access_token"] as const;
const TOKEN_HASH_KEYS = ["access_token", "token"] as const;

/**
 * Prefer hash delivery (not sent to servers / Referer). Fall back to query for legacy backends.
 */
export const extractOAuthToken = (search: string, hash: string): string | null => {
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  for (const key of TOKEN_HASH_KEYS) {
    const value = hashParams.get(key);
    if (value) return value;
  }

  const queryParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const key of TOKEN_QUERY_KEYS) {
    const value = queryParams.get(key);
    if (value) return value;
  }

  return null;
};

/** Opaque one-time OAuth login code from the backend redirect (preferred over JWT-in-URL). */
export const extractOAuthCode = (search: string, hash: string): string | null => {
  const queryParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return queryParams.get("code") ?? hashParams.get("code");
};

export const extractOAuthError = (search: string, hash: string): string | null => {
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const queryParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return hashParams.get("error") ?? queryParams.get("error");
};

/** Drop token/error params from the address bar without a navigation. */
export const clearOAuthParamsFromUrl = (
  pathname: string,
  search: string,
  hash: string
): { pathname: string; search: string; hash: string; href: string } => {
  const queryParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

  for (const key of [...TOKEN_QUERY_KEYS, "code", "error"]) {
    queryParams.delete(key);
  }
  for (const key of [...TOKEN_HASH_KEYS, "code", "error", "token_type", "expires_in"]) {
    hashParams.delete(key);
  }

  const nextSearch = queryParams.toString();
  const nextHash = hashParams.toString();
  const href = `${pathname}${nextSearch ? `?${nextSearch}` : ""}${nextHash ? `#${nextHash}` : ""}`;

  return {
    pathname,
    search: nextSearch ? `?${nextSearch}` : "",
    hash: nextHash ? `#${nextHash}` : "",
    href,
  };
};

export const scrubOAuthParamsFromLocation = () => {
  if (typeof window === "undefined") return;
  const cleaned = clearOAuthParamsFromUrl(
    window.location.pathname,
    window.location.search,
    window.location.hash
  );
  window.history.replaceState(window.history.state, "", cleaned.href);
};

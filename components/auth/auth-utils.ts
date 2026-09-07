export type OAuthProvider = "google" | "github";

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

export const maskEmail = (email: string) => email.replace(/^(.)(.*)(@.*)$/, "$1****$3");

export const isSafeRedirectPath = (value: string) =>
  value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");

export const getSafeRedirectPath = (value: string | null | undefined) =>
  value && isSafeRedirectPath(value) ? value : "/";

export const validatePassword = (
  value: string,
  messages: {
    min?: string;
    uppercase?: string;
    number?: string;
  } = {}
) => {
  if (value.length < 8) return messages.min ?? "Password must be at least 8 characters";
  if (!/[A-Z]/.test(value))
    return messages.uppercase ?? "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(value)) return messages.number ?? "Password must contain at least one number";
  return null;
};

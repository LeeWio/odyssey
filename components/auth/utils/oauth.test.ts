import { describe, expect, it } from "vitest";
import {
  clearOAuthParamsFromUrl,
  extractOAuthCode,
  extractOAuthError,
  extractOAuthToken,
  getOAuthAuthorizationUrl,
  getSafeRedirectPath,
  isSafeRedirectPath,
} from "./oauth";

describe("oauth redirect", () => {
  it("builds OAuth URLs without duplicate slashes", () => {
    expect(getOAuthAuthorizationUrl("google", "https://api.example.com/")).toBe(
      "https://api.example.com/oauth2/authorization/google"
    );
  });

  it("only accepts local redirect paths", () => {
    expect(isSafeRedirectPath("/dashboard?tab=security")).toBe(true);
    expect(isSafeRedirectPath("//evil.example.com")).toBe(false);
    expect(getSafeRedirectPath("https://evil.example.com")).toBe("/");
  });

  it("prefers hash tokens over query tokens", () => {
    expect(extractOAuthToken("?token=query-token", "#access_token=hash-token")).toBe("hash-token");
    expect(extractOAuthToken("?token=query-token", "")).toBe("query-token");
    expect(extractOAuthToken("", "#token=legacy-hash")).toBe("legacy-hash");
  });

  it("reads OAuth errors from hash or query", () => {
    expect(extractOAuthError("?error=access_denied", "")).toBe("access_denied");
    expect(extractOAuthError("", "#error=server_error")).toBe("server_error");
  });

  it("strips OAuth secrets from search and hash", () => {
    const cleaned = clearOAuthParamsFromUrl(
      "/oauth2/redirect",
      "?token=secret&code=opaque&next=/single",
      "#access_token=also-secret&error=x&keep=1"
    );

    expect(cleaned.search).toBe("?next=%2Fsingle");
    expect(cleaned.hash).toBe("#keep=1");
    expect(cleaned.href).toBe("/oauth2/redirect?next=%2Fsingle#keep=1");
    expect(cleaned.search).not.toContain("token=");
    expect(cleaned.search).not.toContain("code=");
    expect(cleaned.hash).not.toContain("access_token=");
    expect(cleaned.hash).not.toContain("error=");
  });

  it("reads the opaque OAuth login code from the query string", () => {
    expect(extractOAuthCode("?code=abc123&error=", "")).toBe("abc123");
    expect(extractOAuthCode("", "#code=from-hash")).toBe("from-hash");
  });
});

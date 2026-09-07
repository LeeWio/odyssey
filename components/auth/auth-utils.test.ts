import { describe, expect, it } from "vitest";
import {
  getOAuthAuthorizationUrl,
  getSafeRedirectPath,
  isSafeRedirectPath,
  maskEmail,
  validatePassword,
} from "./auth-utils";

describe("auth utilities", () => {
  it("builds OAuth URLs without duplicate slashes", () => {
    expect(getOAuthAuthorizationUrl("google", "https://api.example.com/")).toBe(
      "https://api.example.com/oauth2/authorization/google"
    );
  });

  it("masks the private part of an email address", () => {
    expect(maskEmail("alice@example.com")).toBe("a****@example.com");
  });

  it("only accepts local redirect paths", () => {
    expect(isSafeRedirectPath("/dashboard?tab=security")).toBe(true);
    expect(isSafeRedirectPath("//evil.example.com")).toBe(false);
    expect(getSafeRedirectPath("https://evil.example.com")).toBe("/");
  });

  it("enforces the shared registration password policy", () => {
    expect(validatePassword("short")).toBe("Password must be at least 8 characters");
    expect(validatePassword("lowercase1")).toBe(
      "Password must contain at least one uppercase letter"
    );
    expect(validatePassword("Uppercase")).toBe("Password must contain at least one number");
    expect(validatePassword("Validpass1")).toBeNull();
  });
});

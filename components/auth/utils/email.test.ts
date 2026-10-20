import { describe, expect, it } from "vitest";
import { isValidEmail, maskEmail } from "./email";

describe("isValidEmail", () => {
  it("accepts a normal address and rejects a partial one", () => {
    expect(isValidEmail("ada@example.com")).toBe(true);
    expect(isValidEmail("ada@example")).toBe(false);
  });
});

describe("maskEmail", () => {
  it("masks the private part of an email address", () => {
    expect(maskEmail("alice@example.com")).toBe("a****@example.com");
    expect(maskEmail("ab@example.com")).toBe("a****@example.com");
    expect(maskEmail("a@example.com")).toBe("****@example.com");
  });
});

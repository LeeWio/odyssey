import { describe, expect, it } from "vitest";
import { validatePassword } from "./password";

describe("validatePassword", () => {
  it("enforces the shared registration password policy", () => {
    expect(validatePassword("short")).toBe("Password must be at least 8 characters");
    expect(validatePassword("lowercase1")).toBe(
      "Password must contain at least one uppercase letter"
    );
    expect(validatePassword("Uppercase")).toBe("Password must contain at least one number");
    expect(validatePassword("Validpass1")).toBeNull();
  });
});

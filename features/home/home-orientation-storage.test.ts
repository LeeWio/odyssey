import { afterEach, describe, expect, it } from "vitest";

import { HOME_ORIENTATION_COOKIE, dismissHomeOrientation } from "./home-orientation-storage";

describe("home orientation storage", () => {
  afterEach(() => {
    document.cookie = `${HOME_ORIENTATION_COOKIE}=; Path=/; Max-Age=0`;
  });

  it("writes a server-readable dismissed flag", () => {
    dismissHomeOrientation();
    expect(document.cookie).toContain(`${HOME_ORIENTATION_COOKIE}=1`);
  });

  it("survives storage exceptions", () => {
    const broken = {
      set cookie(_value: string) {
        throw new Error("blocked");
      },
    };

    expect(() => dismissHomeOrientation(broken)).not.toThrow();
  });

  it("treats a null storage target as not dismissed", () => {
    expect(() => dismissHomeOrientation(null)).not.toThrow();
  });
});

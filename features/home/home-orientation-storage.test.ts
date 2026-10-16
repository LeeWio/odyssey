import { afterEach, describe, expect, it } from "vitest";

import {
  HOME_ORIENTATION_STORAGE_KEY,
  dismissHomeOrientation,
  isHomeOrientationDismissed,
} from "./home-orientation-storage";

describe("home orientation storage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("treats a missing key as not dismissed", () => {
    expect(isHomeOrientationDismissed(localStorage)).toBe(false);
  });

  it("reads and writes the dismissed flag", () => {
    dismissHomeOrientation(localStorage);
    expect(localStorage.getItem(HOME_ORIENTATION_STORAGE_KEY)).toBe("1");
    expect(isHomeOrientationDismissed(localStorage)).toBe(true);
  });

  it("survives storage exceptions", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(isHomeOrientationDismissed(broken)).toBe(false);
    expect(() => dismissHomeOrientation(broken)).not.toThrow();
  });

  it("treats a null storage target as not dismissed", () => {
    expect(isHomeOrientationDismissed(null)).toBe(false);
    expect(() => dismissHomeOrientation(null)).not.toThrow();
  });
});

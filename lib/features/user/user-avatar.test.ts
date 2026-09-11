import { describe, expect, it } from "vitest";
import { emailAvatarUrl, resolveStoredAvatar } from "./user-avatar";

describe("user avatar", () => {
  it("keeps a stored avatar", () => {
    expect(resolveStoredAvatar(" https://cdn.example/me.png ")).toBe("https://cdn.example/me.png");
    expect(resolveStoredAvatar("")).toBeNull();
  });

  it("builds a gravatar url from email", async () => {
    await expect(emailAvatarUrl("just.vireo@gmail.com")).resolves.toBe(
      "https://www.gravatar.com/avatar/c02e5605cf09189cd25faf458db2be5f1a72d1d41e54553a838c17a11224c591?s=256&d=identicon"
    );
    await expect(emailAvatarUrl("not-an-email")).resolves.toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { isCommentComposerSubmitTarget, resolveGuestCommentIdentity } from "./guest-identity";

const fields = {
  guestEmail: "  guest@example.com  ",
  guestWebsite: "example.com",
  anonymousLabel: "匿名",
};

describe("resolveGuestCommentIdentity", () => {
  it("posts logged-out users as guests with the visible anonymous label", () => {
    expect(
      resolveGuestCommentIdentity({
        ...fields,
        isAuthenticated: false,
        postAsGuest: false,
        guestName: "  ",
      })
    ).toEqual({
      guestName: "匿名",
      guestEmail: "guest@example.com",
      guestWebsite: "https://example.com/",
    });
  });

  it("keeps a typed guest name without requiring a later edit", () => {
    expect(
      resolveGuestCommentIdentity({
        ...fields,
        isAuthenticated: false,
        postAsGuest: true,
        guestName: "  Wei  ",
        guestEmail: "",
        guestWebsite: "",
      })
    ).toEqual({
      guestName: "Wei",
      guestEmail: undefined,
      guestWebsite: undefined,
    });
  });

  it("lets a signed-in account post under its profile until guest mode is chosen", () => {
    expect(
      resolveGuestCommentIdentity({
        ...fields,
        isAuthenticated: true,
        postAsGuest: false,
        guestName: "Wei",
      })
    ).toBeUndefined();
  });

  it("lets a signed-in account switch to a guest signature", () => {
    expect(
      resolveGuestCommentIdentity({
        ...fields,
        isAuthenticated: true,
        postAsGuest: true,
        guestName: "",
      })
    ).toMatchObject({ guestName: "匿名" });
  });
});

describe("isCommentComposerSubmitTarget", () => {
  it("recognizes the nested sheet publish control", () => {
    const button = document.createElement("button");
    button.setAttribute("data-comment-composer-submit", "");
    const label = document.createElement("span");
    button.append(label);
    expect(isCommentComposerSubmitTarget(label)).toBe(true);
    expect(isCommentComposerSubmitTarget(document.createElement("div"))).toBe(false);
  });
});

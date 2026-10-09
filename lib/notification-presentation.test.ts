import { expect, it } from "vitest";

import { getNotificationDestination, getNotificationReaderHref } from "./notification-presentation";

it("opens reader destinations and leaves review queues in the inbox", () => {
  expect(getNotificationReaderHref("/single/example#comment-4")).toBe("/single/example#comment-4");
  expect(getNotificationReaderHref("/moments#comment-8")).toBe("/moments#comment-8");
  expect(getNotificationReaderHref("/guestbook")).toBe("/guestbook");
  expect(getNotificationReaderHref("https://example.com/post")).toBe("https://example.com/post");
  expect(getNotificationReaderHref("/comments?id=4")).toBeNull();
  expect(getNotificationReaderHref("/posts?id=7")).toBeNull();
  expect(getNotificationReaderHref("/links?id=1")).toBeNull();
  expect(getNotificationReaderHref(" javascript:alert(1)")).toBeNull();
});

it("routes structured review contexts to the matching dashboard view", () => {
  expect(
    getNotificationDestination({
      type: "COMMENT_PENDING_REVIEW",
      link: "/comments?id=4",
      context: { objectType: "COMMENT", objectId: 4, action: "REVIEW" },
    })
  ).toEqual({ kind: "dashboard", path: "/comments" });
  expect(
    getNotificationDestination({
      type: "FRIEND_LINK_APPLICATION",
      link: "/links?id=7",
      context: { objectType: "FRIEND_LINK", objectId: 7, action: "REVIEW" },
    })
  ).toEqual({ kind: "dashboard", path: "/links" });
});

it("routes report reviews to the same authorized dashboard surfaces", () => {
  expect(
    getNotificationDestination({
      type: "COMMENT_REPORT_RECEIVED",
      link: "/comments?id=12",
      context: { objectType: "COMMENT", objectId: 12, action: "REVIEW_REPORT" },
    })
  ).toEqual({ kind: "dashboard", path: "/comments" });
  expect(
    getNotificationDestination({
      type: "POST_REPORT_RECEIVED",
      link: "/posts?tab=reports&postId=9",
      context: { objectType: "POST", objectId: 9, action: "REVIEW_REPORT" },
    })
  ).toEqual({ kind: "dashboard", path: "/posts" });
});

it("keeps public and external notification links separate", () => {
  expect(
    getNotificationDestination({
      type: "POST_PUBLISHED",
      link: "/single/example",
      context: null,
    })
  ).toEqual({ kind: "reader", href: "/single/example" });
  expect(
    getNotificationDestination({
      type: "FRIEND_LINK_APPROVED",
      link: "https://example.com",
      context: null,
    })
  ).toEqual({ kind: "external", href: "https://example.com" });
});

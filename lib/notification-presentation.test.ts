import { expect, it } from "vitest";

import { getNotificationReaderHref } from "./notification-presentation";

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

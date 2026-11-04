import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { CardContent } from "./card-content";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({ items }: { items?: unknown[] }) =>
      createElement("div", {
        "data-gallery": items ? "circular" : "compact",
        "data-count": items?.length,
      }),
}));
vi.mock("../feed-motion", () => ({
  momentLayoutTransition: {},
  useMomentMotion: () => ({ enabled: false, reduced: true }),
}));
vi.mock("../moment-content", () => ({
  MomentContent: () => createElement("p", null, "Preserved content"),
}));
vi.mock("./natural-image", () => ({
  NaturalImage: ({ src, bounded }: { src: string; bounded: boolean }) =>
    createElement("img", { src, alt: "Photo", "data-bounded": String(bounded) }),
}));
vi.mock("@heroui/react", () => ({
  Button: ({ children }: { children: React.ReactNode }) => createElement("button", null, children),
  Link: () => null,
  Tag: () => null,
  TagGroup: () => null,
}));

for (const mediaLayout of ["natural", "stacked"] as const) {
  it.each([0, 1, 2, 3, 4, 8])(
    `selects CircularGallery from four photos with ${mediaLayout} media (%i)`,
    (count) => {
      const html = renderToStaticMarkup(
        createElement(CardContent, {
          momentId: 1,
          parsedContent: { type: "doc", content: [] },
          imageUrls: Array.from({ length: count }, (_, index) => `/photo-${index}.jpg`),
          topics: [],
          mediaLayout,
        })
      );
      expect(html).toContain("Preserved content");
      if (count >= 4) {
        expect(html).toContain('data-gallery="circular"');
        expect(html).toContain(`data-count="${count}"`);
        expect(html).not.toContain("<img");
      } else {
        expect(html).not.toContain('data-gallery="circular"');
        if (count > 0)
          expect(html).toContain(mediaLayout === "natural" ? "<img" : 'data-gallery="compact"');
        if (count > 0 && mediaLayout === "natural")
          expect(html).toContain(`data-bounded="${count === 1}"`);
      }
    }
  );
}

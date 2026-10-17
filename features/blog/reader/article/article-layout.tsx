import type { ReactNode, RefObject } from "react";

import { PageContainer } from "@/components/layout/page-container";

/**
 * Large screens keep the body at the reading width and give the rail its own column.
 * The rail stays empty until ArticleToc portals the desktop list into it.
 */
export function ArticleLayout({
  body,
  endRef,
  hero,
  label,
}: {
  body: ReactNode;
  endRef?: RefObject<HTMLDivElement | null>;
  hero: ReactNode;
  label: string;
}) {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip bg-transparent">
      <PageContainer className="relative z-10 px-0 pb-24 md:px-0 xl:px-0">
        <article className="w-full min-w-0" data-reading-content>
          {hero}
          <div className="mx-auto grid w-full max-w-6xl items-start gap-8 xl:grid-cols-[minmax(0,48rem)_14rem] xl:justify-center">
            <div className="min-w-0">{body}</div>
            <aside
              aria-label={label}
              className="sticky top-28 hidden min-h-px xl:block"
              id="article-toc-rail"
            />
          </div>
          <div ref={endRef} aria-hidden="true" data-article-end />
        </article>
      </PageContainer>
    </div>
  );
}

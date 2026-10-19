import type { ReactNode, RefObject } from "react";

import { PageContainer } from "@/components/layout/page-container";

/**
 * The reading column is max-w-3xl and centered.
 * From xl up, the page is three tracks: context, the article, and On this page.
 * Below xl the side tracks drop. The outline stays above the article, and
 * context follows it. Empty tracks stay so the article does not shift.
 */
export function ArticleLayout({
  body,
  context,
  endRef,
  footer,
  hero,
  label,
  showContext = false,
}: {
  body: ReactNode;
  context?: ReactNode;
  endRef?: RefObject<HTMLDivElement | null>;
  footer?: ReactNode;
  hero: ReactNode;
  label: string;
  showContext?: boolean;
}) {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip bg-transparent">
      <PageContainer className="relative z-10 px-4 pb-28 md:px-6 xl:px-8">
        <article className="w-full min-w-0" data-reading-content>
          {hero}
          <div className="mx-auto grid w-full max-w-3xl items-start xl:max-w-[85rem] xl:grid-cols-[16rem_minmax(0,48rem)_16rem] xl:justify-center xl:gap-10">
            <div className="hidden min-h-px xl:block">
              {showContext ? (
                <aside
                  aria-label={label}
                  className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-y-contain"
                  data-article-context
                >
                  {context}
                </aside>
              ) : null}
            </div>
            <div className="min-w-0">{body}</div>
            <div className="hidden min-h-px xl:block">
              <aside aria-label={label} className="sticky top-28" id="article-toc-rail" />
            </div>
          </div>
          {footer}
          <div ref={endRef} aria-hidden="true" data-article-end />
        </article>
      </PageContainer>
    </div>
  );
}

import type { ReactNode, RefObject } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";

/**
 * The reading column is max-w-3xl and centered.
 * From xl up, context sits in a sticky track beside the article.
 * The outline opens from the reading action bar.
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
          <div
            className={cn(
              "mx-auto grid w-full max-w-3xl items-start",
              showContext &&
                "xl:max-w-[68rem] xl:grid-cols-[16rem_minmax(0,48rem)] xl:justify-center xl:gap-10"
            )}
          >
            {showContext ? (
              <div className="hidden min-h-px self-stretch xl:block">
                <aside
                  aria-label={label}
                  className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-y-contain"
                  data-article-context
                >
                  {context}
                </aside>
              </div>
            ) : null}
            <div className="min-w-0">{body}</div>
          </div>
          {footer}
          <div ref={endRef} aria-hidden="true" data-article-end />
        </article>
      </PageContainer>
    </div>
  );
}

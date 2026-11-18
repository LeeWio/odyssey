import type { ReactNode, RefObject } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";

/**
 * The reading column stays max-w-3xl and centered.
 * Context sits on the left from xl. Continuation sits on the right from 2xl.
 * A side appears only when it has content. The outline opens from the action bar.
 */
export function ArticleLayout({
  body,
  context,
  continueAside,
  continueLabel,
  endRef,
  footer,
  hero,
  label,
  showContext = false,
  showContinue = false,
}: {
  body: ReactNode;
  context?: ReactNode;
  continueAside?: ReactNode;
  continueLabel?: string;
  endRef?: RefObject<HTMLDivElement | null>;
  footer?: ReactNode;
  hero: ReactNode;
  label: string;
  showContext?: boolean;
  showContinue?: boolean;
}) {
  const columns = showContext
    ? "xl:max-w-[68rem] xl:grid-cols-[16rem_minmax(0,48rem)] xl:justify-center 2xl:max-w-[92rem] 2xl:grid-cols-[16rem_minmax(0,48rem)_20rem]"
    : "2xl:max-w-[68rem] 2xl:grid-cols-[minmax(0,48rem)_20rem] 2xl:justify-center";

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip bg-transparent [&_*]:[overflow-anchor:none]">
      <PageContainer className="relative z-10 pb-36">
        <article className="w-full min-w-0" data-reading-content>
          <div
            className={cn(
              "mx-auto grid w-full max-w-3xl items-start xl:gap-10 2xl:gap-10",
              columns
            )}
          >
            {showContext ? <div aria-hidden="true" className="hidden xl:block" /> : null}
            <div
              className={cn("col-span-full min-w-0", showContext && "xl:col-span-1 xl:col-start-2")}
            >
              {hero}
            </div>
            <div aria-hidden="true" className="hidden 2xl:block" />
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
            <div className={cn("col-start-1 min-w-0", showContext && "xl:col-start-2")}>{body}</div>
            <div
              className={cn(
                "invisible absolute min-h-px self-stretch",
                showContinue && "2xl:visible 2xl:static 2xl:col-start-3"
              )}
            >
              <aside
                aria-label={continueLabel}
                className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-visible"
                data-article-continue
              >
                {continueAside}
              </aside>
            </div>
          </div>
          {footer}
          <div ref={endRef} aria-hidden="true" data-article-end />
        </article>
      </PageContainer>
    </div>
  );
}

"use client";

import { TextArea } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCallback, useLayoutEffect, useRef } from "react";
import { CodeLineNumberGutter } from "./code-block-motion";
import { CodeLineNumbers, getCodeLineCount } from "./code-line-numbers";
import { CodeTokens } from "./code-preview";
import type { HighlightedLines } from "./highlight-code";

export function CodeSourceEditor({
  code,
  tokens,
  showLineNumbers,
  onChange,
}: {
  code: string;
  tokens: HighlightedLines;
  showLineNumbers: boolean;
  onChange: (code: string) => void;
}) {
  const t = useTranslations("CodeBlock");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLDivElement>(null);
  const lines = getCodeLineCount(code);
  const hasHighlight = tokens !== null;

  const syncScroll = useCallback((field: HTMLTextAreaElement) => {
    if (gutter.current) gutter.current.scrollTop = field.scrollTop;
    if (highlight.current) {
      highlight.current.style.transform = `translate(${-field.scrollLeft}px, ${-field.scrollTop}px)`;
    }
  }, []);

  useLayoutEffect(() => {
    if (textarea.current) syncScroll(textarea.current);
  }, [hasHighlight, showLineNumbers, lines, syncScroll]);

  return (
    <div className="flex min-w-0 font-mono text-sm/6 tracking-normal" dir="ltr">
      <CodeLineNumberGutter show={showLineNumbers}>
        <div className="relative w-max shrink-0 pe-4 tabular-nums">
          <span className="invisible">{lines}</span>
          <div
            ref={gutter}
            className="absolute inset-y-0 start-0 end-4 overflow-hidden pt-[calc(var(--spacing)*2+var(--border-width-field))] pb-8"
          >
            <CodeLineNumbers count={lines} />
          </div>
        </div>
      </CodeLineNumberGutter>
      <div className="relative min-w-0 flex-1">
        {hasHighlight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden border-[length:var(--border-width-field)] border-transparent forced-colors:hidden"
          >
            <div
              ref={highlight}
              className="py-2 text-base/6 whitespace-pre [tab-size:4] sm:text-sm/6"
            >
              <CodeTokens code={code} tokens={tokens} />
            </div>
          </div>
        )}
        <TextArea
          ref={textarea}
          aria-label={t("source")}
          className={
            "relative block resize-y scrollbar-none overflow-auto bg-transparent! px-0 font-mono leading-6 whitespace-pre! [tab-size:4] backdrop-filter-none!" +
            (hasHighlight
              ? " caret-field-foreground selection:text-field-foreground! text-transparent! forced-colors:text-[CanvasText]!"
              : "")
          }
          fullWidth
          placeholder={t("placeholder")}
          rows={Math.min(16, Math.max(5, lines))}
          spellCheck={false}
          value={code}
          variant="secondary"
          wrap="off"
          onChange={(event) => onChange(event.currentTarget.value)}
          onScroll={(event) => syncScroll(event.currentTarget)}
        />
      </div>
    </div>
  );
}

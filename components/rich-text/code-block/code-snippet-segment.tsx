"use client";

import { Segment } from "@heroui-pro/react";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef } from "react";
import { getSnippetLabel, type CodeSnippetLabel } from "./code-snippets";

export function CodeSnippetSegment({
  snippets,
  selectedIndex,
  onSelect,
  className,
}: {
  snippets: readonly CodeSnippetLabel[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  const t = useTranslations("CodeBlock");
  const segmentScrollRef = useRef<HTMLDivElement>(null);
  const count = snippets.length;
  const currentLabel = getSnippetLabel(snippets[selectedIndex]!, t("untitled"));

  useLayoutEffect(() => {
    const scroll = segmentScrollRef.current;
    if (!scroll || scroll.scrollWidth <= scroll.clientWidth) return;

    const selected = scroll.querySelector('[data-selected="true"]');
    if (!selected) return;

    const viewport = scroll.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    const focusRoom = parseFloat(getComputedStyle(scroll).paddingInlineStart);
    const rightOverflow = item.right - viewport.right + focusRoom;
    const leftOverflow = item.left - viewport.left - focusRoom;
    if (rightOverflow > 0) scroll.scrollLeft += rightOverflow;
    if (leftOverflow < 0) scroll.scrollLeft += leftOverflow;
  }, [count, currentLabel, selectedIndex]);

  return (
    <div ref={segmentScrollRef} className="min-w-0 overflow-x-auto p-1">
      <div className="w-max">
        <Segment
          aria-label={t("snippets")}
          className={className}
          size="sm"
          selectedKey={selectedIndex}
          onSelectionChange={(key) => onSelect(Number(key))}
        >
          {snippets.map((snippet, index) => {
            const label = getSnippetLabel(snippet, t("untitled"));
            return (
              <Segment.Item id={index} key={index}>
                <bdi className="max-w-48 truncate" title={label}>
                  {label}
                </bdi>
              </Segment.Item>
            );
          })}
        </Segment>
      </div>
    </div>
  );
}

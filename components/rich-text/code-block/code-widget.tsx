"use client";

import { Widget } from "@heroui-pro/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { CodeBlockChrome } from "./code-block-chrome";
import type { CodeBlockFrame } from "./code-block-frame";
import { CodeSnippetTransition } from "./code-block-motion";
import { CodeSnippetSegment } from "./code-snippet-segment";
import { CopyCodeButton } from "./copy-code-button";
import { getSnippetLabel, type CodeSnippetLabel } from "./code-snippets";

type CodeWidgetProps = {
  chrome: CodeBlockChrome;
  frame: CodeBlockFrame;
  snippets: readonly CodeSnippetLabel[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onLayoutTransitionEnd?: () => void;
  copyText: string;
  children: ReactNode;
};

export function CodeWidget({
  chrome,
  frame,
  snippets,
  selectedIndex,
  onSelect,
  onLayoutTransitionEnd,
  copyText,
  children,
}: CodeWidgetProps) {
  const t = useTranslations("CodeBlock");
  return (
    <Widget
      data-code-widget=""
      data-code-chrome={chrome}
      data-code-frame={frame}
      className="w-full min-w-0"
    >
      {chrome === "segment" && (
        <Widget.Header className="min-w-0">
          <CodeSnippetSegment
            snippets={snippets}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            // The Widget already provides the Glass backdrop for its header controls.
            className="backdrop-filter-none!"
          />
          <div className="shrink-0">
            <CopyCodeButton copyText={copyText} />
          </div>
        </Widget.Header>
      )}
      {chrome === "windows" && (
        <Widget.Header className="min-w-0">
          <div className="grid w-full grid-cols-[1fr_minmax(0,2fr)_1fr] items-center">
            <span aria-hidden="true" className="flex gap-2">
              <span className="bg-muted/40 size-2 shrink-0 rounded-full" />
              <span className="bg-muted/40 size-2 shrink-0 rounded-full" />
              <span className="bg-muted/40 size-2 shrink-0 rounded-full" />
            </span>
            <Widget.Title className="truncate text-center">
              {getSnippetLabel(snippets[selectedIndex]!, t("untitled"))}
            </Widget.Title>
            <div className="justify-self-end">
              <CopyCodeButton copyText={copyText} />
            </div>
          </div>
        </Widget.Header>
      )}
      <Widget.Content
        className={
          "motion-safe:transition-[margin,border-radius,box-shadow] motion-safe:duration-200 motion-safe:ease-out" +
          (frame === "solid" ? " m-0 rounded-none shadow-none" : "")
        }
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === "margin-bottom") {
            onLayoutTransitionEnd?.();
          }
        }}
      >
        <CodeSnippetTransition
          selectedIndex={selectedIndex}
          onLayoutTransitionEnd={onLayoutTransitionEnd}
        >
          {children}
        </CodeSnippetTransition>
      </Widget.Content>
    </Widget>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { readCodeBlockChrome } from "./code-block-chrome";
import { readCodeBlockFrame } from "./code-block-frame";
import { CodeWidget } from "./code-widget";
import type { CodeSnippet } from "./code-snippets";

export function ReadingCodeWidget({
  chrome,
  frame,
  snippets,
}: {
  chrome: unknown;
  frame: unknown;
  snippets: (CodeSnippet & { panel: ReactNode })[];
}) {
  const [index, setSelectedIndex] = useState(0);
  const selectedIndex = Math.min(index, snippets.length - 1);
  const snippet = snippets[selectedIndex];
  if (!snippet) return null;

  return (
    <div data-reading-code="" className="min-w-0">
      <CodeWidget
        chrome={readCodeBlockChrome(chrome, snippets.length)}
        frame={readCodeBlockFrame(frame)}
        snippets={snippets}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        copyText={snippet.code}
      >
        <div key={selectedIndex}>{snippet.panel}</div>
      </CodeWidget>
    </div>
  );
}

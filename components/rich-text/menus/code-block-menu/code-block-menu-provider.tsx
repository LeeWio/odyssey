"use client";

import { createContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { CodeBlockChrome } from "../../code-block/code-block-chrome";
import type { CodeBlockFrame } from "../../code-block/code-block-frame";
import type { CodeSnippet } from "../../code-block/code-snippets";
import { CodeBlockMenu } from "./code-block-menu";

export interface CodeBlockMenuTarget {
  getPos: () => number | undefined;
  snippets: CodeSnippet[];
  selectedIndex: number;
  chrome: CodeBlockChrome;
  frame: CodeBlockFrame;
  showLineNumbers: boolean;
  onSnippetsChange: (snippets: CodeSnippet[], selectedIndex: number) => void;
  onChromeChange: (chrome: CodeBlockChrome) => void;
  onFrameChange: (frame: CodeBlockFrame) => void;
  onLineNumbersChange: (show: boolean) => void;
}

export const CodeBlockMenuContext = createContext<Dispatch<
  SetStateAction<CodeBlockMenuTarget | null>
> | null>(null);

export function CodeBlockMenuProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<CodeBlockMenuTarget | null>(null);

  return (
    <CodeBlockMenuContext.Provider value={setTarget}>
      <CodeBlockMenu target={target} />
      {children}
    </CodeBlockMenuContext.Provider>
  );
}

import { Fragment, type CSSProperties } from "react";
import { CodeLineNumberGutter } from "./code-block-motion";
import { CodeLineNumbers, getCodeLineCount } from "./code-line-numbers";
import type { HighlightedLines } from "./highlight-code";

export function CodeTokens({ code, tokens }: { code: string; tokens: HighlightedLines }) {
  if (!tokens) return code;

  const highlighted = [];
  let offset = 0;
  for (const token of tokens.flat()) {
    const gap = code.slice(offset, token.offset);
    offset = token.offset + token.content.length;
    const style = {
      "--syntax-light": token.htmlStyle?.color ?? "currentColor",
      "--syntax-dark": token.htmlStyle?.["--shiki-dark"] ?? "currentColor",
    } as CSSProperties;
    highlighted.push(
      <Fragment key={token.offset}>
        {gap}
        <span
          data-code-token=""
          className="text-(--syntax-light) dark:text-(--syntax-dark)"
          style={style}
        >
          {code.slice(token.offset, offset)}
        </span>
      </Fragment>
    );
  }

  return (
    <>
      {highlighted}
      {code.slice(offset)}
    </>
  );
}

export function CodePreview({
  code,
  tokens,
  showLineNumbers = true,
}: {
  code: string;
  tokens: HighlightedLines;
  showLineNumbers?: boolean;
}) {
  return (
    <div className="flex min-w-0 text-left font-mono text-sm/6 tracking-normal" dir="ltr">
      <CodeLineNumberGutter show={showLineNumbers}>
        <div className="w-max shrink-0 pe-4">
          <CodeLineNumbers count={getCodeLineCount(code)} />
        </div>
      </CodeLineNumberGutter>
      <pre className="m-0! min-w-0 flex-1 overflow-x-auto rounded-none! bg-transparent! p-0! leading-6!">
        <code data-snippet-source="" className="[tab-size:4]">
          <CodeTokens code={code} tokens={tokens} />
        </code>
      </pre>
    </div>
  );
}

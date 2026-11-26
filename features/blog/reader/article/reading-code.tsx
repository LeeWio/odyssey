import { Fragment, type CSSProperties } from "react";
import { CopyReadingCode } from "./copy-reading-code";

async function highlightCode(code: string, language: unknown) {
  if (typeof language !== "string" || !language || code.length > 50_000) return code;

  const { bundledLanguages, codeToTokens } = await import("shiki/bundle/web");
  if (!Object.hasOwn(bundledLanguages, language)) return code;

  const { tokens } = await codeToTokens(code, {
    lang: language as keyof typeof bundledLanguages,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
  const newlines = code.match(/\r\n|\n|\r/g) ?? [];
  if (
    tokens
      .map((line, index) => line.map(({ content }) => content).join("") + (newlines[index] ?? ""))
      .join("") !== code
  )
    return code;

  return tokens.map((line, index) => (
    <Fragment key={index}>
      {line.map(({ content, htmlStyle, offset }) => (
        <span
          key={offset}
          className="text-[color:var(--shiki-light)] [html[data-theme$=dark]_&]:text-[color:var(--shiki-dark)]"
          style={htmlStyle as CSSProperties}
        >
          {content}
        </span>
      ))}
      {newlines[index]}
    </Fragment>
  ));
}

export async function ReadingCode({ code, language }: { code: string; language: unknown }) {
  const content = await highlightCode(code, language).catch(() => code);
  return (
    <div data-reading-code="" className="min-w-0">
      <div className="flex justify-end">
        <CopyReadingCode />
      </div>
      <pre className="overflow-x-auto">
        <code className={typeof language === "string" ? `language-${language}` : undefined}>
          {content}
        </code>
      </pre>
    </div>
  );
}

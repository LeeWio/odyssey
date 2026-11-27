import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { resolveCodeLanguage, type CodeSnippet } from "./code-snippets";

const grammars = {
  shellscript: () => import("shiki/dist/langs/shellscript.mjs"),
  c: () => import("shiki/dist/langs/c.mjs"),
  cpp: () => import("shiki/dist/langs/cpp.mjs"),
  cmake: () => import("shiki/dist/langs/cmake.mjs"),
  css: () => import("shiki/dist/langs/css.mjs"),
  html: () => import("shiki/dist/langs/html.mjs"),
  java: () => import("shiki/dist/langs/java.mjs"),
  javascript: () => import("shiki/dist/langs/javascript.mjs"),
  jsx: () => import("shiki/dist/langs/jsx.mjs"),
  json: () => import("shiki/dist/langs/json.mjs"),
  kotlin: () => import("shiki/dist/langs/kotlin.mjs"),
  markdown: () => import("shiki/dist/langs/markdown.mjs"),
  python: () => import("shiki/dist/langs/python.mjs"),
  sql: () => import("shiki/dist/langs/sql.mjs"),
  typescript: () => import("shiki/dist/langs/typescript.mjs"),
  tsx: () => import("shiki/dist/langs/tsx.mjs"),
} satisfies Record<NonNullable<ReturnType<typeof resolveCodeLanguage>>, () => Promise<unknown>>;

const themes = { light: "github-light", dark: "github-dark" } as const;
const MAX_HIGHLIGHT_LENGTH = 50_000;
const MAX_HIGHLIGHT_LINE_LENGTH = 2_000;

function createHighlighter() {
  return createHighlighterCore({
    themes: [
      import("shiki/dist/themes/github-light.mjs"),
      import("shiki/dist/themes/github-dark.mjs"),
    ],
    engine: createJavaScriptRegexEngine(),
  });
}

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;
const languageLoads = new Map<string, Promise<void>>();

export async function highlightCode({ code, language }: CodeSnippet) {
  const lang = resolveCodeLanguage(language);
  if (
    !lang ||
    !code ||
    code.length > MAX_HIGHLIGHT_LENGTH ||
    code.split("\n").some((line) => line.length > MAX_HIGHLIGHT_LINE_LENGTH)
  )
    return null;

  try {
    const highlighter = await (highlighterPromise ??= createHighlighter().catch(
      (error: unknown) => {
        highlighterPromise = undefined;
        throw error;
      }
    ));

    if (!highlighter.getLoadedLanguages().includes(lang)) {
      let load = languageLoads.get(lang);
      if (!load) {
        load = highlighter.loadLanguage(grammars[lang]()).finally(() => languageLoads.delete(lang));
        languageLoads.set(lang, load);
      }
      await load;
    }

    return highlighter.codeToTokens(code, { lang, themes }).tokens;
  } catch {
    return null;
  }
}

export type HighlightedLines = Awaited<ReturnType<typeof highlightCode>>;

export interface CodeSnippet {
  name?: string;
  language: string | null;
  code: string;
}

export type CodeSnippetLabel = Pick<CodeSnippet, "name" | "language">;

export const EMPTY_SNIPPET: CodeSnippet = { language: null, code: "" };

export function readCodeSnippets(value: unknown): CodeSnippet[] {
  const snippets = Array.isArray(value)
    ? value.flatMap((snippet: Partial<CodeSnippet> | null) => {
        if (typeof snippet?.code !== "string") return [];
        const name = typeof snippet.name === "string" ? snippet.name.trim() : "";
        return [
          {
            ...(name ? { name } : {}),
            language: typeof snippet.language === "string" ? snippet.language : null,
            code: snippet.code,
          },
        ];
      })
    : [];
  return snippets.length ? snippets : [EMPTY_SNIPPET];
}

export const CODE_LANGUAGES = {
  shellscript: "Bash",
  c: "C",
  cpp: "C++",
  cmake: "CMake",
  css: "CSS",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  jsx: "JSX",
  json: "JSON",
  kotlin: "Kotlin",
  markdown: "Markdown",
  python: "Python",
  sql: "SQL",
  typescript: "TypeScript",
  tsx: "TSX",
} as const;

type CodeLanguage = keyof typeof CODE_LANGUAGES;

const aliases = new Map<string, CodeLanguage>([
  ["bash", "shellscript"],
  ["sh", "shellscript"],
  ["shell", "shellscript"],
  ["c++", "cpp"],
  ["js", "javascript"],
  ["kt", "kotlin"],
  ["md", "markdown"],
  ["py", "python"],
  ["ts", "typescript"],
  ["javascriptreact", "jsx"],
  ["typescriptreact", "tsx"],
]);

export function resolveCodeLanguage(value: string | null): CodeLanguage | undefined {
  if (!value) return undefined;
  const language = value.trim().toLowerCase();
  return (
    aliases.get(language) ??
    (Object.hasOwn(CODE_LANGUAGES, language) ? (language as CodeLanguage) : undefined)
  );
}

export function getSnippetLabel({ name, language }: CodeSnippetLabel, untitled: string) {
  const languageId = resolveCodeLanguage(language);
  return name || (languageId ? CODE_LANGUAGES[languageId] : language?.trim()) || untitled;
}

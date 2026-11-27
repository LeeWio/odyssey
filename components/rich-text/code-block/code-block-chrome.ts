export const CODE_BLOCK_CHROMES = ["segment", "windows", "none"] as const;
export type CodeBlockChrome = (typeof CODE_BLOCK_CHROMES)[number];

export function readCodeBlockChrome(value: unknown, snippetCount: number): CodeBlockChrome {
  return snippetCount === 1 && (value === "windows" || value === "none") ? value : "segment";
}

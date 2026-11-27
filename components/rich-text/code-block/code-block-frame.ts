export const CODE_BLOCK_FRAMES = ["inset", "solid"] as const;
export type CodeBlockFrame = (typeof CODE_BLOCK_FRAMES)[number];

export function readCodeBlockFrame(value: unknown): CodeBlockFrame {
  return value === "solid" ? "solid" : "inset";
}

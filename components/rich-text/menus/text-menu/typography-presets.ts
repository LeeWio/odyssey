import type { EditorState } from "@tiptap/pm/state";

export const TYPOGRAPHY_PRESETS = [
  {
    id: "default",
    label: "Default",
    fontFamily: null,
    fontSize: null,
    lineHeight: null,
  },
  {
    id: "editorial",
    label: "Editorial",
    fontFamily: "Georgia",
    fontSize: "18px",
    lineHeight: "1.8",
  },
  {
    id: "compact",
    label: "Compact",
    fontFamily: "sans-serif",
    fontSize: "14px",
    lineHeight: "1.25",
  },
] as const;

export type TypographyPreset = (typeof TYPOGRAPHY_PRESETS)[number];

export function getSelectionTypography({ doc, selection }: EditorState) {
  let preset: TypographyPreset["id"] | null | undefined;
  let lineHeight: string | undefined;

  doc.nodesBetween(selection.from, selection.to, (node, _pos, parent) => {
    if (!node.isText) return;
    const style = node.marks.find((mark) => mark.type.name === "textStyle")?.attrs;
    const family = typeof style?.fontFamily === "string" ? style.fontFamily.toLowerCase() : "";
    const height = style?.lineHeight || parent?.attrs.lineHeight || "";
    lineHeight ??= height;
    const match = TYPOGRAPHY_PRESETS.find(
      (item) =>
        (item.fontFamily ?? "").toLowerCase() === family &&
        (item.fontSize ?? "") === (style?.fontSize ?? "") &&
        (item.lineHeight ?? "") === height
    )?.id;
    preset = preset === undefined || preset === match ? (match ?? null) : null;
  });

  return { lineHeight: lineHeight ?? "", typographyPreset: preset ?? null };
}

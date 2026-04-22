import { BlocksKit } from "./blocks-kit";
import { FloatingToolbarKit } from "./floating-toolbar-kit";
import { LinkKit } from "./link-kit";
import { MarksKit } from "./marks-kit";
import { FontKit } from "./font-kit";
import { LineHeightKit } from "./line-height-kit";
import { AlignKit } from "./align-kit";
import { IndentKit } from "./indent-kit";
import { ExitBreakKit } from "./exit-break-kit";
import { BlockSelectionKit } from "./block-selection-kit";
import { MentionKit } from "./mention-kit";
import { BlockPlaceholderKit } from "./block-placeholder-kit";
import { ToggleKit } from "./toggle-kit";
import { MathKit } from "./math-kit";
import { DndKit } from "./dnd-kit";
import { BlockMenuKit } from "./block-menu-kit";
import { ColumnKit } from "./column-kit";
import { CodeBlockKit } from "./code-block-kit";
import { MarkdownKit } from "./markdown-kit";
import { AutoformatKit } from "./autoformat";
import { ListKit } from "./list-kit";

export const Plugins = [
  ...BlocksKit,
  ...MarksKit,
  ...FloatingToolbarKit,
  ...LinkKit,
  ...FontKit,
  ...LineHeightKit,
  ...AlignKit,
  ...IndentKit,
  ...ExitBreakKit,
  ...BlockSelectionKit,
  ...MentionKit,
  ...BlockPlaceholderKit,
  ...ToggleKit,
  ...MathKit,
  ...DndKit,
  ...BlockMenuKit,
  ...ColumnKit,
  ...CodeBlockKit,
  ...MarkdownKit,
  ...AutoformatKit,
  ...ListKit
];

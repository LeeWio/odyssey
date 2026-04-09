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
  ...BlockPlaceholderKit
];

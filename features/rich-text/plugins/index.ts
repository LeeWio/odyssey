import { BlocksKit } from "./blocks-kit";
import { FloatingToolbarKit } from "./floating-toolbar-kit";
import { LinkKit } from "./link-kit";
import { MarksKit } from "./marks-kit";
import { FontKit } from "./font-kit";
import { LineHeightKit } from "./line-height-kit";

export const Plugins = [
  ...BlocksKit,
  ...MarksKit,
  ...FloatingToolbarKit,
  ...LinkKit,
  ...FontKit,
  ...LineHeightKit,
];

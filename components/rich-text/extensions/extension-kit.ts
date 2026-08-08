import {
  BlockFormatTransition,
  Column,
  Columns,
  DetailsKit,
  Indent,
  Image,
  Subscript,
  Superscript,
  TableKit,
  TextAlign,
  TextStyleKit,
  Typography,
  createTableOfContents,
} from ".";
import type { TableOfContentsOptions } from "@tiptap/extension-table-of-contents";
import { Markdown } from "@tiptap/markdown";

export interface ExtensionKitOptions {
  tableOfContents?: Partial<TableOfContentsOptions>;
}

export function createExtensionKit(options: ExtensionKitOptions = {}) {
  return [
    BlockFormatTransition,
    ...DetailsKit,
    Image,
    Typography,
    Subscript,
    Superscript,
    TextAlign,
    TextStyleKit,
    Indent,
    Column,
    Columns,
    Markdown,
    TableKit,
    createTableOfContents(options.tableOfContents),
  ];
}

export const ExtensionKit = createExtensionKit();

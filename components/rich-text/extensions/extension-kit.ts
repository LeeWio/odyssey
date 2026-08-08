import {
  BlockFormatTransition,
  Column,
  Columns,
  Indent,
  Image,
  Subscript,
  Superscript,
  TableKit,
  TableOfContents,
  TextAlign,
  TextStyleKit,
  Typography,
} from ".";
import { Markdown } from "@tiptap/markdown";

export const ExtensionKit = [
  BlockFormatTransition,
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
  TableOfContents,
];

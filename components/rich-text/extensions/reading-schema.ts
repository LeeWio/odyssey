import { TableKit } from "@tiptap/extension-table";
import { BulletList, ListItem, OrderedList, TaskItem, TaskList } from "@tiptap/extension-list";
import StarterKit from "@tiptap/starter-kit";
import { Heading } from "./heading";
import { ImageSchema } from "./Image/image-schema";
import { ImageUploadSchema } from "./ImageUpload/image-upload-schema";
import { AudioSchema } from "./media/audio-schema";
import { AttachmentSchema } from "./media/attachment-schema";
import { Youtube } from "./media/youtube";
import { Mathematics } from "./mathematics";
import { Details, DetailsContent, DetailsSummary } from "./details";
import { EmojiBase } from "./emoji/emoji-base";
import { ColumnsSchema } from "./multi-column/columns-schema";
import { Column } from "./multi-column/column";
import { Indent } from "./indent";
import { Mention } from "./mention";
import { Subscript } from "./subscript";
import { Superscript } from "./superscript";
import { TextAlign } from "./text-align";
import { TextStyleKit } from "./text-style-kit";
import { Typography } from "./typography";

export function createDocumentStarterKit() {
  return StarterKit.configure({
    bulletList: false,
    heading: false,
    listItem: false,
    orderedList: false,
  });
}

export function createDocumentExtensions() {
  return [
    Details,
    DetailsSummary,
    DetailsContent,
    EmojiBase,
    ImageSchema,
    ImageUploadSchema,
    AudioSchema,
    AttachmentSchema,
    Youtube,
    Mathematics,
    Mention,
    Typography,
    BulletList,
    OrderedList,
    ListItem,
    TaskList,
    TaskItem.configure({ nested: true }),
    Subscript,
    Superscript,
    TextAlign,
    TextStyleKit,
    Indent,
    Column,
    ColumnsSchema,
    Heading,
    TableKit.configure({ table: { renderWrapper: true, cellMinWidth: 100 } }),
  ];
}

export function createReadingSchema() {
  return [createDocumentStarterKit(), ...createDocumentExtensions()];
}

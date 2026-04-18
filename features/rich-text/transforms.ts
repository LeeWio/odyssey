import { triggerFloatingLink } from "@platejs/link/react";
import { KEYS, TElement, PathApi } from "platejs";
import { PlateEditor } from "platejs/react";
import { insertDate } from "@platejs/date";
import { insertCodeDrawing } from "@platejs/code-drawing";
import { insertCodeBlock } from "@platejs/code-block";
import { SuggestionPlugin } from "@platejs/suggestion/react";
import { insertColumnGroup } from "@platejs/layout";
import { insertCallout } from "@platejs/callout";
import { insertEquation, insertInlineEquation } from "@platejs/math";
import { insertExcalidraw } from "@platejs/excalidraw";
import { TablePlugin } from "@platejs/table/react";
import { insertToc } from "@platejs/toc";
import {
  insertAudioPlaceholder,
  insertFilePlaceholder,
  insertMedia,
  insertVideoPlaceholder,
} from "@platejs/media";

type InsertBlockOptions = {
  upsert?: boolean;
};

export const insertBlock = (
  editor: PlateEditor,
  type: string,
  options: InsertBlockOptions = {},
) => {
  const { upsert = false } = options;
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();
    if (!block) return;
    const [currentNode, path] = block;
    const isCurrentBlockEmpty = editor.api.isEmpty(currentNode);
    const currentBlockType = getBlockType(currentNode);
    const isSameBlockType = type === currentBlockType;
    if (upsert && isCurrentBlockEmpty && isSameBlockType) {
      return;
    }
    if (type in insertBlockMap) {
      insertBlockMap[type](editor, type);
    } else {
      editor.tf.insertNodes(editor.api.create.block({ type }), {
        at: PathApi.next(path),
        select: true,
      });
    }
    if (!isSameBlockType) {
      editor.getApi(SuggestionPlugin).suggestion.withoutSuggestions(() => {
        editor.tf.removeNodes({ previousEmptyBlock: true });
      });
    }
  });
};

const ACTION_THREE_COLUMNS = "action_three_columns";

const insertList = (editor: PlateEditor, type: string) => {
  editor.tf.insertNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    { select: true },
  );
};

const insertBlockMap: Record<string, (editor: PlateEditor, type: string) => void> = {
  [KEYS.listTodo]: insertList,
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
  [ACTION_THREE_COLUMNS]: (editor) => insertColumnGroup(editor, { columns: 3, select: true }),
  [KEYS.audio]: (editor) => insertAudioPlaceholder(editor, { select: true }),
  [KEYS.callout]: (editor) => insertCallout(editor, { select: true }),
  [KEYS.codeBlock]: (editor) => insertCodeBlock(editor, { select: true }),
  [KEYS.codeDrawing]: (editor) => insertCodeDrawing(editor, {}, { select: true }),
  [KEYS.equation]: (editor) => insertEquation(editor, { select: true }),
  [KEYS.excalidraw]: (editor) => insertExcalidraw(editor, {}, { select: true }),
  [KEYS.file]: (editor) => insertFilePlaceholder(editor, { select: true }),
  [KEYS.img]: (editor) =>
    insertMedia(editor, {
      select: true,
      type: KEYS.img,
    }),
  [KEYS.mediaEmbed]: (editor) =>
    insertMedia(editor, {
      select: true,
      type: KEYS.mediaEmbed,
    }),
  [KEYS.table]: (editor) => editor.getTransforms(TablePlugin).insert.table({}, { select: true }),
  [KEYS.toc]: (editor) => insertToc(editor, { select: true }),
  [KEYS.video]: (editor) => insertVideoPlaceholder(editor, { select: true }),
};

const insertInlineMap: Record<string, (editor: PlateEditor, type: string) => void> = {
  [KEYS.date]: (editor) => insertDate(editor, { select: true }),
  [KEYS.inlineEquation]: (editor) => insertInlineEquation(editor, "", { select: true }),
  [KEYS.link]: (editor) => triggerFloatingLink(editor, { focused: true }),
};

export const insertInlineElement = (editor: PlateEditor, type: string) => {
  if (insertInlineMap[type]) {
    insertInlineMap[type](editor, type);
  }
};

export const getBlockType = (block: TElement) => {
  if (block[KEYS.listType]) {
    if (block[KEYS.listType] === KEYS.ol) {
      return KEYS.ol;
    }
    if (block[KEYS.listType] === KEYS.listTodo) {
      return KEYS.listTodo;
    }
    return KEYS.ul;
  }

  return block.type;
};

"use client";

import { useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { isNodeSelection } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { CODE_BLOCK_MENU_KEY } from "../menus/code-block-menu/code-block-menu";
import { CodeBlockMenuContext } from "../menus/code-block-menu/code-block-menu-provider";
import { readCodeBlockChrome, type CodeBlockChrome } from "./code-block-chrome";
import { readCodeBlockFrame, type CodeBlockFrame } from "./code-block-frame";
import { CodePreview } from "./code-preview";
import { CodeSourceEditor } from "./code-source-editor";
import { CodeWidget } from "./code-widget";
import { readCodeSnippets, resolveCodeLanguage, type CodeSnippet } from "./code-snippets";
import type { HighlightedLines } from "./highlight-code";

function useSnippetHighlight({ code, language }: CodeSnippet) {
  const [highlight, setHighlight] = useState<{
    code: string;
    language: string | null;
    tokens: HighlightedLines;
  }>();

  useEffect(() => {
    if (!resolveCodeLanguage(language) || !code) return;
    let active = true;
    void import("./highlight-code")
      .then(({ highlightCode }) => highlightCode({ code, language }))
      .then((tokens) => {
        if (active) setHighlight({ code, language, tokens });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [code, language]);

  return highlight?.code === code && highlight.language === language ? highlight.tokens : null;
}

export function CodeBlockNodeView({
  editor,
  getPos,
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const { isDisabled, isReadOnly } = useRichTextEditor();
  const setMenuTarget = useContext(CodeBlockMenuContext);
  const [index, setIndex] = useState(0);
  const pendingSelection = useRef<number | null>(null);
  const snippets = useMemo(() => readCodeSnippets(node.attrs.snippets), [node.attrs.snippets]);
  const selectedIndex = Math.min(index, snippets.length - 1);
  const snippet = snippets[selectedIndex]!;
  const tokens = useSnippetHighlight(snippet);
  const chrome = readCodeBlockChrome(node.attrs.chrome, snippets.length);
  const frame = readCodeBlockFrame(node.attrs.frame);
  const showLineNumbers = node.attrs.showLineNumbers !== false;
  const canEdit = !isDisabled && !isReadOnly;

  useEffect(() => {
    const nextIndex = pendingSelection.current;
    if (nextIndex === null || nextIndex >= snippets.length) return;

    // Let the new Segment item mount before it participates in the shared indicator animation.
    const frame = requestAnimationFrame(() => {
      if (pendingSelection.current !== nextIndex) return;
      pendingSelection.current = null;
      setIndex(nextIndex);
    });
    return () => cancelAnimationFrame(frame);
  }, [snippets.length]);

  const selectSnippet = (nextIndex: number) => {
    pendingSelection.current = null;
    setIndex(nextIndex);
  };

  const refreshMenuPosition = useCallback(() => {
    const { selection } = editor.state;
    if (isNodeSelection(selection) && selection.from === getPos()) {
      editor.commands.setMeta(CODE_BLOCK_MENU_KEY, "updatePosition");
    }
  }, [editor, getPos]);

  const selectBlock = () => {
    if (!canEdit || !editor.isEditable) return;
    const position = getPos();
    const { selection } = editor.state;
    if (typeof position !== "number") return;
    if (!(isNodeSelection(selection) && selection.from === position)) {
      editor.commands.setNodeSelection(position);
      return;
    }

    // The editor can keep its node selection when focus moves back from another control.
    editor.commands.setMeta(CODE_BLOCK_MENU_KEY, "show");
    editor.commands.setMeta(CODE_BLOCK_MENU_KEY, "updatePosition");
  };

  const updateBlock = useCallback(
    (attributes: {
      snippets?: CodeSnippet[];
      showLineNumbers?: boolean;
      chrome?: CodeBlockChrome;
      frame?: CodeBlockFrame;
    }) => {
      const position = getPos();
      const { selection } = editor.state;
      if (typeof position !== "number") return;
      if (!isNodeSelection(selection) || selection.from !== position) {
        updateAttributes(attributes);
        return;
      }

      // Changing an atom's attributes can move its node selection to a neighboring block.
      const transaction = editor.state.tr.setNodeMarkup(position, undefined, {
        ...selection.node.attrs,
        ...attributes,
      });
      transaction.setSelection(NodeSelection.create(transaction.doc, position));
      editor.view.dispatch(transaction);
    },
    [editor, getPos, updateAttributes]
  );

  useLayoutEffect(() => {
    if (!selected || !canEdit || !setMenuTarget) return;

    setMenuTarget({
      getPos,
      snippets,
      selectedIndex,
      chrome,
      frame,
      showLineNumbers,
      onSnippetsChange: (nextSnippets, nextIndex) => {
        const isAdding = nextSnippets.length > snippets.length;
        if (isAdding && chrome !== "segment") return;
        pendingSelection.current = isAdding ? nextIndex : null;
        updateBlock({ snippets: nextSnippets, chrome });
        if (!isAdding) setIndex(nextIndex);
      },
      onChromeChange: (nextChrome) => {
        if (
          nextChrome !== chrome &&
          nextChrome === readCodeBlockChrome(nextChrome, snippets.length)
        ) {
          updateBlock({ chrome: nextChrome });
        }
      },
      onLineNumbersChange: (show) => updateBlock({ showLineNumbers: show }),
      onFrameChange: (nextFrame) => updateBlock({ frame: nextFrame }),
    });
    return () => setMenuTarget((target) => (target?.getPos === getPos ? null : target));
  }, [
    canEdit,
    chrome,
    frame,
    getPos,
    selected,
    selectedIndex,
    setMenuTarget,
    showLineNumbers,
    snippets,
    updateBlock,
  ]);

  return (
    <NodeViewWrapper
      contentEditable={false}
      className="min-w-0"
      data-code-block-editor=""
      onFocus={(event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.target)) selectBlock();
      }}
    >
      <CodeWidget
        chrome={chrome}
        frame={frame}
        snippets={snippets}
        selectedIndex={selectedIndex}
        onSelect={(nextIndex) => {
          selectSnippet(nextIndex);
          selectBlock();
        }}
        onLayoutTransitionEnd={canEdit ? refreshMenuPosition : undefined}
        copyText={snippet.code}
      >
        {canEdit ? (
          <CodeSourceEditor
            key={selectedIndex}
            code={snippet.code}
            tokens={tokens}
            showLineNumbers={showLineNumbers}
            onChange={(code) =>
              updateBlock({
                snippets: snippets.map((item, index) =>
                  index === selectedIndex ? { ...item, code } : item
                ),
              })
            }
          />
        ) : (
          <CodePreview
            key={selectedIndex}
            code={snippet.code}
            tokens={tokens}
            showLineNumbers={showLineNumbers}
          />
        )}
      </CodeWidget>
    </NodeViewWrapper>
  );
}

"use client";

import { Checkbox } from "@heroui/react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

function getCheckboxLabel({ node, extension }: Pick<NodeViewProps, "node" | "extension">) {
  const checked = Boolean(node.attrs.checked);
  const label = extension.options?.a11y?.checkboxLabel?.(node, checked);

  return label || `Task item checkbox for ${node.textContent || "empty task item"}`;
}

export function TaskItemNodeView({ editor, extension, node, getPos }: NodeViewProps) {
  const checked = Boolean(node.attrs.checked);
  const label = getCheckboxLabel({ extension, node });

  const handleChange = (isSelected: boolean) => {
    if (!editor.isEditable || typeof getPos !== "function") return;

    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .command(({ tr }) => {
        const position = getPos();

        if (typeof position !== "number") return false;

        const currentNode = tr.doc.nodeAt(position);

        if (!currentNode) return false;

        tr.setNodeMarkup(position, undefined, {
          ...currentNode.attrs,
          checked: isSelected,
        });

        return true;
      })
      .run();
  };

  return (
    <NodeViewWrapper className="contents">
      <div className="contents" contentEditable={false}>
        <Checkbox
          aria-label={label}
          className="mt-1 shrink-0"
          isReadOnly={!editor.isEditable}
          isSelected={checked}
          onChange={handleChange}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      </div>
      <NodeViewContent
        as="div"
        className={checked ? "text-muted min-w-0 flex-1 line-through" : "min-w-0 flex-1"}
      />
    </NodeViewWrapper>
  );
}

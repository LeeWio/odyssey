"use client";

import { Radio, RadioGroup } from "@heroui/react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function BulletListItemNodeView({ getPos }: NodeViewProps) {
  const position = typeof getPos === "function" ? getPos() : 0;
  const value = `bullet-${position}`;

  return (
    <NodeViewWrapper className="contents">
      <RadioGroup aria-label="Bullet" className="**:data-[slot=radio]:mt-0" value={value}>
        <div className="flex h-7 shrink-0 items-center" contentEditable={false}>
          <Radio className="mt-0 shrink-0" value={value}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
            </Radio.Content>
          </Radio>
        </div>
      </RadioGroup>
      <NodeViewContent as="div" className="min-w-0 flex-1" />
    </NodeViewWrapper>
  );
}

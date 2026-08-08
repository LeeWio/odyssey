"use client";

import { Button, Label, Popover, Surface, TextArea } from "@heroui/react";
import { Segment } from "@heroui-pro/react";
import katex from "katex";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

export type MathKind = "inline" | "block";

interface MathEditorPopoverProps {
  allowKindChange?: boolean;
  children: ReactNode;
  initialKind?: MathKind;
  initialLatex?: string;
  submitLabel: string;
  title: string;
  onSubmit: (value: { kind: MathKind; latex: string }) => boolean;
}

interface MathEditorPanelProps {
  allowKindChange?: boolean;
  autoFocus?: boolean;
  initialKind?: MathKind;
  initialLatex?: string;
  submitLabel: string;
  title: string;
  onCancel?: () => void;
  onDelete?: () => void;
  onSubmit: (value: { kind: MathKind; latex: string }) => boolean;
}

function MathPreview({ kind, latex }: { kind: MathKind; latex: string }) {
  const previewRef = useRef<HTMLSpanElement>(null);
  const normalizedLatex = latex.trim();

  useEffect(() => {
    if (!previewRef.current || !normalizedLatex) return;

    katex.render(normalizedLatex, previewRef.current, {
      displayMode: kind === "block",
      strict: false,
      throwOnError: false,
    });
  }, [kind, normalizedLatex]);

  return (
    <Surface
      aria-label="Formula preview"
      className="grid min-h-20 place-items-center overflow-x-auto rounded-2xl px-4 py-3 text-center"
      variant="secondary"
    >
      {normalizedLatex ? (
        <span ref={previewRef} className="max-w-full" />
      ) : (
        <span className="text-muted text-sm">Formula preview</span>
      )}
    </Surface>
  );
}

export function MathEditorPopover({
  allowKindChange = true,
  children,
  initialKind = "inline",
  initialLatex = "",
  submitLabel,
  title,
  onSubmit,
}: MathEditorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
      {children}
      <Popover.Content className="w-[min(22rem,calc(100vw-2rem))]" isNonModal placement="bottom">
        <Popover.Dialog className="flex flex-col gap-3 p-3">
          <Popover.Arrow />
          {isOpen && (
            <MathEditorPanel
              allowKindChange={allowKindChange}
              initialKind={initialKind}
              initialLatex={initialLatex}
              submitLabel={submitLabel}
              title={title}
              onCancel={() => setIsOpen(false)}
              onSubmit={(value) => {
                const didSubmit = onSubmit(value);

                if (didSubmit) setIsOpen(false);

                return didSubmit;
              }}
            />
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export function MathEditorPanel({
  allowKindChange = true,
  autoFocus = true,
  initialKind = "inline",
  initialLatex = "",
  submitLabel,
  title,
  onCancel,
  onDelete,
  onSubmit,
}: MathEditorPanelProps) {
  const [kind, setKind] = useState<MathKind>(initialKind);
  const [latex, setLatex] = useState(initialLatex);
  const inputId = useId();

  const submit = () => {
    const normalizedLatex = latex.trim();

    if (!normalizedLatex) return;

    onSubmit({ kind, latex: normalizedLatex });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {allowKindChange && (
          <Segment
            aria-label="Formula type"
            selectedKey={kind}
            size="sm"
            onSelectionChange={(key) => setKind(String(key) as MathKind)}
          >
            <Segment.Item id="inline">Inline</Segment.Item>
            <Segment.Item id="block">Block</Segment.Item>
          </Segment>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>LaTeX</Label>
        <TextArea
          autoFocus={autoFocus}
          fullWidth
          aria-label="LaTeX formula"
          className="min-h-20 resize-y font-mono text-sm"
          id={inputId}
          placeholder="e.g. \\frac{a}{b}"
          rows={2}
          value={latex}
          onChange={(event) => setLatex(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
      </div>

      <MathPreview kind={kind} latex={latex} />

      <div className="flex items-center justify-end gap-2">
        {onDelete && (
          <Button className="text-danger mr-auto" size="sm" variant="ghost" onPress={onDelete}>
            Delete
          </Button>
        )}
        {onCancel && (
          <Button size="sm" variant="ghost" onPress={onCancel}>
            Cancel
          </Button>
        )}
        <Button isDisabled={!latex.trim()} size="sm" onPress={submit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

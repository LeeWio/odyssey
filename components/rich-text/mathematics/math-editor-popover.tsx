"use client";

import { MathOperations, Text } from "@gravity-ui/icons";
import { Button, FieldError, Label, Popover, Surface, TextArea, TextField } from "@heroui/react";
import { Segment } from "@heroui-pro/react/segment";
import katex from "katex";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { mathematicsKatexOptions } from "../extensions/mathematics";

export type MathKind = "inline" | "block";

const examples: Record<MathKind, string> = {
  inline: "x^2 + y^2 = r^2",
  block: "\\int_0^1 x^2\\,dx = \\frac{1}{3}",
};

interface MathEditorPopoverProps {
  children: ReactNode;
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
  onCancel?: () => void;
  onDelete?: () => void;
  onSubmit: (value: { kind: MathKind; latex: string }) => boolean;
}

export function MathEditorPopover({
  children,
  submitLabel,
  title,
  onSubmit,
}: MathEditorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      {children}
      <Popover.Content placement="bottom end" className="w-96 max-w-[calc(100dvw-1.5rem)]">
        <Popover.Dialog className="flex flex-col gap-3">
          <Popover.Heading className="text-base font-semibold">{title}</Popover.Heading>
          {isOpen && (
            <MathEditorPanel
              submitLabel={submitLabel}
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
  onCancel,
  onDelete,
  onSubmit,
}: MathEditorPanelProps) {
  const [kind, setKind] = useState<MathKind>(initialKind);
  const [latex, setLatex] = useState(initialLatex);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const normalizedLatex = latex.trim();
  const preview = useMemo(() => {
    try {
      return {
        html: katex.renderToString(normalizedLatex || examples[kind], {
          ...mathematicsKatexOptions,
          displayMode: kind === "block",
          macros: { ...mathematicsKatexOptions.macros },
          throwOnError: true,
          trust: false,
        }),
        error: null,
      };
    } catch (error) {
      if (!(error instanceof katex.ParseError)) throw error;
      return { html: null, error: error.rawMessage };
    }
  }, [kind, normalizedLatex]);
  const canSubmit = Boolean(normalizedLatex && !preview.error);

  useEffect(() => {
    if (!autoFocus) return;

    // Let the popover establish its focus scope before focusing the editor field.
    const frame = requestAnimationFrame(() => sourceRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  const submit = () => {
    if (canSubmit) onSubmit({ kind, latex: normalizedLatex });
  };

  return (
    <div className="flex flex-col gap-3">
      {allowKindChange && (
        <Segment
          aria-label="Formula type"
          className="w-full"
          selectedKey={kind}
          size="sm"
          onSelectionChange={(key) => {
            if (key === "inline" || key === "block") setKind(key);
          }}
        >
          <Segment.Item id="inline">
            <Text aria-hidden="true" />
            Inline
          </Segment.Item>
          <Segment.Item id="block">
            <MathOperations aria-hidden="true" />
            Block
          </Segment.Item>
        </Segment>
      )}

      <TextField
        fullWidth
        isInvalid={preview.error !== null}
        value={latex}
        variant="secondary"
        onChange={setLatex}
      >
        <Label>LaTeX</Label>
        <TextArea
          ref={sourceRef}
          autoCapitalize="off"
          autoComplete="off"
          className="max-h-40 resize-y font-mono"
          placeholder="Enter LaTeX"
          rows={2}
          spellCheck={false}
          onKeyDown={(event) => {
            if (
              !event.nativeEvent.isComposing &&
              (event.metaKey || event.ctrlKey) &&
              event.key === "Enter"
            ) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <section aria-label="Formula preview" className="mt-2 flex min-w-0 flex-col gap-1">
          <div className="flex min-h-8 items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Preview</h3>
            {!normalizedLatex && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setLatex(examples[kind]);
                  sourceRef.current?.focus();
                }}
              >
                Use example
              </Button>
            )}
          </div>
          <Surface className="max-h-40 min-h-24 overflow-auto rounded-2xl" variant="secondary">
            {preview.html ? (
              <div
                className="data-example:text-muted grid min-h-24 w-max min-w-full place-items-center px-4 py-3"
                data-example={!normalizedLatex || undefined}
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            ) : (
              <div className="grid min-h-24 place-items-center px-4 py-3 text-center">
                <FieldError>{preview.error}</FieldError>
              </div>
            )}
          </Surface>
        </section>
      </TextField>

      <div className="flex items-center justify-end gap-2">
        {onDelete && (
          <Button className="mr-auto" size="sm" variant="danger-soft" onPress={onDelete}>
            Delete
          </Button>
        )}
        {onCancel && (
          <Button size="sm" variant="ghost" onPress={onCancel}>
            Cancel
          </Button>
        )}
        <Button isDisabled={!canSubmit} size="sm" onPress={submit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

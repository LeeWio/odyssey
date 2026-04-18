"use client";
import * as React from "react";
import type { TEquationElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { CurlyBracketsFunction } from "@gravity-ui/icons";

import { useEquationElement } from "@platejs/math/react";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import {
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useReadOnly,
  useSelected,
} from "platejs/react";
import { cn } from "@heroui/styles";
import { Popover } from "@heroui/react/popover";
import { Button, Input } from "@heroui/react";

export function EquationElement(props: PlateElementProps<TEquationElement>) {
  const selected = useSelected();
  const [open, setOpen] = React.useState(selected);
  const katexRef = React.useRef<HTMLDivElement | null>(null);

  useEquationElement({
    element: props.element,
    katexRef,
    options: {
      displayMode: true,
      errorColor: "#cc0000",
      fleqn: false,
      leqno: false,
      macros: { "\\f": "#1f(#2)" },
      output: "htmlAndMathml",
      strict: "warn",
      throwOnError: false,
      trust: false,
    },
  });

  return (
    <PlateElement className="my-1" {...props}>
      <Popover isOpen={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <div
            className={cn(
              "group hover:bg-accent/10 data-[selected=true]:bg-accent/10 flex cursor-pointer items-center justify-center rounded-sm select-none",
              props.element.texExpression.length === 0 ? "bg-muted p-3 pr-9" : "px-2 py-1",
            )}
            data-selected={selected}
            contentEditable={false}
            role="button"
          >
            {props.element.texExpression.length > 0 ? (
              <span ref={katexRef} />
            ) : (
              <div className="text-muted-foreground flex h-7 w-full items-center gap-2 text-sm whitespace-nowrap">
                <CurlyBracketsFunction className="text-muted-foreground/80 size-6" />
                <div>Add a Tex equation</div>
              </div>
            )}
          </div>
        </Popover.Trigger>
        <EquationPopoverContent
          open={open}
          placeholder={
            "f(x) = \\begin{cases}\n  x^2, &\\quad x > 0 \\\\\n  0, &\\quad x = 0 \\\\\n  -x^2, &\\quad x < 0\n\\end{cases}"
          }
          isInline={false}
          setOpen={setOpen}
        />
      </Popover>
    </PlateElement>
  );
}

export function InlineEquationElement(props: PlateElementProps<TEquationElement>) {
  const element = props.element;
  const katexRef = React.useRef<HTMLDivElement | null>(null);
  const selected = useSelected();
  const isCollapsed = useEditorSelector((editor) => editor.api.isCollapsed(), []);
  const [open, setOpen] = React.useState(selected && isCollapsed);
  React.useEffect(() => {
    if (selected && isCollapsed) {
      setOpen(true);
    }
  }, [selected, isCollapsed]);

  useEquationElement({
    element,
    katexRef,
    options: {
      displayMode: true,
      errorColor: "#cc0000",
      fleqn: false,
      leqno: false,
      macros: { "\\f": "#1f(#2)" },
      output: "htmlAndMathml",
      strict: "warn",
      throwOnError: false,
      trust: false,
    },
  });

  return (
    <PlateElement
      {...props}
      className={cn("mx-1 inline-block select-none [&_.katex-display]:my-0!")}
    >
      <Popover isOpen={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <div
            className={cn(
              'after:absolute after:inset-0 after:-top-0.5 after:-left-1 after:z-1 after:h-[calc(100%)+4px] after:w-[calc(100%+8px)] after:rounded-sm after:content-[""]',
              "h-6",
              ((element.texExpression.length > 0 && open) || selected) && "after:bg-accent-soft",
              element.texExpression.length === 0 && "text-muted-foreground after:bg-warning-soft",
            )}
            contentEditable={false}
          >
            <span
              ref={katexRef}
              className={cn(
                element.texExpression.length === 0 && "hidden",
                "font-mono leading-none",
              )}
            />
            {element.texExpression.length === 0 && (
              <span>
                <CurlyBracketsFunction className="mr-1 inline-block h-4.75 w-4 py-[1.5px] align-text-bottom" />
                New equation
              </span>
            )}
          </div>
        </Popover.Trigger>
        <EquationPopoverContent placeholder="E = m^2" isInline open={open} setOpen={setOpen} />
      </Popover>
    </PlateElement>
  );
}

const EquationPopoverContent = ({
  isInline,
  open,
  setOpen,
  placeholder,
}: {
  isInline: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  placeholder: string;
}) => {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const element = useElement<TEquationElement>();

  const [value, setValue] = React.useState(element.texExpression || "");

  React.useEffect(() => {
    if (open) {
      setValue(element.texExpression || "");
    }
  }, [open, element.texExpression]);

  if (readOnly) return null;

  const onClose = () => {
    if (isInline) {
      editor.tf.select(element, { focus: true, next: true });
    } else {
      editor.getApi(BlockSelectionPlugin).blockSelection.set(element.id as string);
    }
    setOpen(false);
  };

  const onSubmit = () => {
    editor.tf.setNodes({ texExpression: value }, { at: element });
    onClose();
  };

  return (
    <Popover.Content className="max-w-80">
      <Input
        autoFocus
        aria-label=""
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }

          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
      />

      <Button onClick={onSubmit} size="sm">
        Done
      </Button>
    </Popover.Content>
  );
};

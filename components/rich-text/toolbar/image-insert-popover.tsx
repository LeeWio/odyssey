"use client";

import { Button, FieldError, Form, Input, Label, Popover, TextField, Tooltip } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { type FormEvent, useState } from "react";

function getImageUrlError(value: string) {
  const url = value.trim();

  if (!url) {
    return "Enter an image URL.";
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "Use an HTTP or HTTPS image URL.";
    }
  } catch {
    return "Enter a valid image URL.";
  }

  return null;
}

export function ImageInsertPopover() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editor || getImageUrlError(src)) {
      return;
    }

    const normalizedUrl = new URL(src.trim()).toString();
    const altText = alt.trim();

    editor
      .chain()
      .focus()
      .setImage({
        src: normalizedUrl,
        ...(altText ? { alt: altText } : {}),
      })
      .run();

    setSrc("");
    setAlt("");
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip delay={0}>
        <Button
          aria-label="Insert image"
          isDisabled={!editor || isDisabled || isReadOnly}
          isIconOnly
          size="sm"
          variant="ghost"
        >
          <Icon aria-hidden="true" className="size-4" icon="gravity-ui:picture" />
        </Button>
        <Tooltip.Content>Insert image</Tooltip.Content>
      </Tooltip>

      <Popover.Content className="w-80" placement="bottom">
        <Popover.Arrow />
        <Popover.Dialog className="flex flex-col gap-3">
          <Popover.Heading>Insert image</Popover.Heading>

          <Form aria-label="Insert image" className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <TextField
              isRequired
              name="imageUrl"
              type="url"
              validate={getImageUrlError}
              value={src}
              onChange={setSrc}
            >
              <Label>Image URL</Label>
              <Input autoFocus placeholder="https://example.com/image.jpg" variant="secondary" />
              <FieldError />
            </TextField>

            <TextField name="imageAlt" value={alt} onChange={setAlt}>
              <Label>Alternative text</Label>
              <Input placeholder="Describe the image" variant="secondary" />
            </TextField>

            <Button
              className="self-end"
              isDisabled={!editor || isDisabled || isReadOnly || src.trim() === ""}
              size="sm"
              type="submit"
              variant="primary"
            >
              Insert image
            </Button>
          </Form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

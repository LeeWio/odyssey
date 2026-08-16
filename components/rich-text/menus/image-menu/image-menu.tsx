"use client";

import { Button, Input, Label, Modal, Popover, Slider, TextField, toast } from "@heroui/react";
import {
  RichTextEditor,
  Segment,
  useRichTextEditor,
  useRichTextEditorState,
} from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { isNodeSelection } from "@tiptap/core";
import NextImage from "next/image";
import { useCallback, useRef, useState, type ChangeEvent } from "react";

import {
  IMAGE_MAX_WIDTH_PERCENT,
  IMAGE_MIN_WIDTH_PERCENT,
  IMAGE_WIDTH_STEP,
  normalizeImageAlignment,
  normalizeImageWidthPercent,
  type ImageAlignment,
} from "../../extensions/image/image-attributes";
import { queueImageUpload, validateImageFile } from "../../extensions/image/image-upload";
import type { ShouldShowProps } from "../types";

interface ImagePreview {
  alt: string;
  src: string;
}

export function ImageMenu() {
  const [preview, setPreview] = useState<ImagePreview | null>(null);
  const replacementInputRef = useRef<HTMLInputElement>(null);
  const { editor } = useRichTextEditor();
  const imageAttributes = useRichTextEditorState((state) => state.editor.getAttributes("image"));
  const src = typeof imageAttributes?.src === "string" ? imageAttributes.src : "";
  const alt = typeof imageAttributes?.alt === "string" ? imageAttributes.alt : "";
  const caption = typeof imageAttributes?.caption === "string" ? imageAttributes.caption : "";
  const widthPercent = normalizeImageWidthPercent(imageAttributes?.widthPercent);
  const alignment = normalizeImageAlignment(imageAttributes?.alignment);

  const shouldShow = useCallback(({ editor, state }: ShouldShowProps) => {
    const { selection } = state;

    return (
      editor.isEditable &&
      !editor.view.dragging &&
      isNodeSelection(selection) &&
      selection.node.type.name === "image" &&
      typeof selection.node.attrs.src === "string" &&
      selection.node.attrs.src.length > 0
    );
  }, []);

  const copyImageUrl = useCallback(() => {
    if (!src) return;

    void navigator.clipboard
      .writeText(src)
      .then(() => toast.success("Image URL copied."))
      .catch(() => toast.danger("Could not copy the image URL."));
  }, [src]);

  const updateImageAttributes = useCallback(
    (attributes: {
      alignment?: ImageAlignment;
      alt?: string;
      caption?: string;
      widthPercent?: number;
    }) => {
      editor?.chain().updateAttributes("image", attributes).run();
    },
    [editor]
  );

  const replaceImage = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.item(0);
      event.target.value = "";
      if (!file || !editor) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        toast.warning(validationError);
        return;
      }

      editor
        .chain()
        .focus()
        .updateAttributes("image", { uploadId: queueImageUpload(editor, file) })
        .run();
    },
    [editor]
  );

  return (
    <>
      <RichTextEditor.BubbleMenu
        aria-label="Image actions"
        pluginKey="image-menu"
        shouldShow={shouldShow}
        appendTo={() =>
          (document.querySelector("[data-slot='modal-dialog']") as HTMLElement) || document.body
        }
      >
        <RichTextEditor.ToolbarGroup aria-label="Image actions">
          <Popover>
            <Button
              aria-label={`Image width: ${widthPercent}%`}
              className="tabular-nums"
              size="sm"
              variant="ghost"
            >
              <Icon aria-hidden="true" icon="gravity-ui:picture" />
              {widthPercent}%
            </Button>
            <Popover.Content className="w-64" placement="top">
              <Popover.Dialog className="flex flex-col gap-3 p-3">
                <Popover.Arrow />
                <Slider
                  maxValue={IMAGE_MAX_WIDTH_PERCENT}
                  minValue={IMAGE_MIN_WIDTH_PERCENT}
                  step={IMAGE_WIDTH_STEP}
                  value={widthPercent}
                  onChange={(value) => {
                    const nextValue = Array.isArray(value) ? value[0] : value;
                    updateImageAttributes({
                      widthPercent: normalizeImageWidthPercent(nextValue),
                    });
                  }}
                >
                  <Label>Image width</Label>
                  <Slider.Output>{({ state }) => `${state.values[0]}%`}</Slider.Output>
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          <Segment
            aria-label="Image alignment"
            selectedKey={alignment}
            size="sm"
            variant="ghost"
            onSelectionChange={(key) => {
              updateImageAttributes({ alignment: normalizeImageAlignment(key) });
            }}
          >
            <Segment.Item aria-label="Align image left" id="left">
              <Icon aria-hidden="true" icon="gravity-ui:layout-split-side-content-left" />
            </Segment.Item>
            <Segment.Item aria-label="Align image center" id="center">
              <Icon aria-hidden="true" icon="gravity-ui:layout-split-columns" />
            </Segment.Item>
            <Segment.Item aria-label="Align image right" id="right">
              <Icon aria-hidden="true" icon="gravity-ui:layout-split-side-content-right" />
            </Segment.Item>
          </Segment>

          <RichTextEditor.ToolbarSeparator orientation="vertical" />

          <Popover>
            <Button isIconOnly aria-label="Edit image description" size="sm" variant="ghost">
              <Icon aria-hidden="true" icon="gravity-ui:text" />
            </Button>
            <Popover.Content className="w-72" placement="top">
              <Popover.Dialog className="flex flex-col gap-3 p-3">
                <Popover.Arrow />
                <TextField isRequired isInvalid={!alt.trim()} name="image-alt-text">
                  <Label>Alternative text</Label>
                  <Input
                    autoFocus
                    aria-describedby="image-alt-help"
                    value={alt}
                    variant="secondary"
                    onChange={(event) => updateImageAttributes({ alt: event.target.value })}
                  />
                  <p id="image-alt-help" className="text-muted text-xs">
                    Describe the image for people who cannot see it. Required to publish.
                  </p>
                </TextField>
                <TextField name="image-caption">
                  <Label>Caption</Label>
                  <Input
                    value={caption}
                    variant="secondary"
                    onChange={(event) => updateImageAttributes({ caption: event.target.value })}
                  />
                </TextField>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>

          <RichTextEditor.CommandButton
            aria-label="Replace image"
            tooltip="Replace image"
            onCommand={() => replacementInputRef.current?.click()}
          >
            <Icon aria-hidden="true" icon="gravity-ui:arrow-rotate-right" />
          </RichTextEditor.CommandButton>

          <RichTextEditor.CommandButton
            aria-label="View image full screen"
            isDisabled={!src}
            tooltip="View full screen"
            onCommand={() => setPreview({ alt, src })}
          >
            <Icon aria-hidden="true" icon="gravity-ui:arrows-expand" />
          </RichTextEditor.CommandButton>

          <RichTextEditor.CommandButton
            aria-label="Open original image"
            isDisabled={!src}
            tooltip="Open original"
            onCommand={() => {
              if (src) window.open(src, "_blank", "noopener,noreferrer");
            }}
          >
            <Icon aria-hidden="true" icon="gravity-ui:arrow-up-right-from-square" />
          </RichTextEditor.CommandButton>

          <RichTextEditor.CommandButton
            aria-label="Copy image URL"
            isDisabled={!src}
            tooltip="Copy image URL"
            onCommand={copyImageUrl}
          >
            <Icon aria-hidden="true" icon="gravity-ui:copy" />
          </RichTextEditor.CommandButton>

          <RichTextEditor.ToolbarSeparator orientation="vertical" />

          <RichTextEditor.CommandButton
            aria-label="Delete image"
            tooltip="Delete image"
            onCommand={(editor) => editor.chain().focus().deleteSelection().run()}
          >
            <Icon aria-hidden="true" className="text-danger" icon="gravity-ui:trash-bin" />
          </RichTextEditor.CommandButton>
        </RichTextEditor.ToolbarGroup>
        <input
          ref={replacementInputRef}
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="sr-only"
          tabIndex={-1}
          type="file"
          onChange={replaceImage}
        />
      </RichTextEditor.BubbleMenu>

      <Modal.Backdrop
        isOpen={preview !== null}
        variant="blur"
        onOpenChange={(isOpen) => {
          if (!isOpen) setPreview(null);
        }}
      >
        <Modal.Container size="full">
          <Modal.Dialog
            aria-label="Image preview"
            className="bg-background h-dvh overflow-hidden p-0"
          >
            <Modal.CloseTrigger />
            <Modal.Body className="relative min-h-0 flex-1 p-6 sm:p-10">
              {preview && (
                <NextImage
                  fill
                  priority
                  alt={preview.alt || "Selected image"}
                  className="object-contain p-6 sm:p-10"
                  sizes="100vw"
                  src={preview.src}
                  unoptimized
                />
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}

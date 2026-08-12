"use client";

import { toast } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import { useEffect } from "react";

import { createImageAltText, queueImageUpload, validateImageFile } from "./image-upload";

function getImageFiles(files: FileList | null): File[] {
  if (!files) return [];

  return Array.from(files).filter((file) => file.type.startsWith("image/"));
}

export function ImageUploadHandler() {
  const { editor } = useRichTextEditor();

  useEffect(() => {
    if (!editor) return;

    const insertImages = (files: File[], position?: number) => {
      const images = files.flatMap((file) => {
        const validationError = validateImageFile(file);

        if (validationError) {
          toast.warning(validationError);
          return [];
        }

        return [
          {
            type: "image",
            attrs: {
              alt: createImageAltText(file.name),
              uploadId: queueImageUpload(editor, file),
            },
          },
        ];
      });

      if (images.length === 0) return;

      const chain = editor.chain().focus();
      if (typeof position === "number") {
        chain.insertContentAt(position, images).run();
      } else {
        chain.insertContent(images).run();
      }
    };

    const previousEditorProps = editor.options.editorProps;
    const previousHandlePaste = previousEditorProps.handlePaste;
    const previousHandleDrop = previousEditorProps.handleDrop;
    const handlePaste: NonNullable<typeof previousEditorProps.handlePaste> = (
      view,
      event,
      slice
    ) => {
      const files = getImageFiles(event.clipboardData?.files ?? null);
      if (files.length === 0) return previousHandlePaste?.(view, event, slice);

      event.preventDefault();
      insertImages(files);
      return true;
    };

    const handleDrop: NonNullable<typeof previousEditorProps.handleDrop> = (
      view,
      event,
      slice,
      moved
    ) => {
      const files = getImageFiles(event.dataTransfer?.files ?? null);
      if (files.length === 0) return previousHandleDrop?.(view, event, slice, moved);

      event.preventDefault();
      const position = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
      insertImages(files, position);
      return true;
    };

    editor.setOptions({
      editorProps: {
        ...previousEditorProps,
        handleDrop,
        handlePaste,
      },
    });

    return () => {
      editor.setOptions({ editorProps: previousEditorProps });
    };
  }, [editor]);

  return null;
}

"use client";

import { DropZone } from "@heroui-pro/react";
import {
  Button,
  Form,
  Input,
  Label,
  Spinner,
  Switch,
  TextArea,
  TextField,
  Tooltip,
  Typography,
  toast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { DropZoneProps } from "react-aria-components";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FileResponse } from "@/lib/features/file";
import { useUploadFileMutation } from "@/lib/features/file";
import type { MomentImageResponse, MomentRequest, MomentResponse } from "@/lib/features/moment";

const MAX_IMAGES = 9;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type UploadStatus = "uploading" | "complete" | "failed";
type DropEvent = Parameters<NonNullable<DropZoneProps["onDrop"]>>[0];

interface ComposerImage {
  localId: string;
  file?: File;
  response: FileResponse | null;
  existing: MomentImageResponse | null;
  previewUrl: string;
  name: string;
  altText: string;
  status: UploadStatus;
  progress: number;
  errorMessage?: string;
}

interface MomentComposerProps {
  initialMoment: MomentResponse | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (request: MomentRequest) => Promise<void>;
}

function defaultAltText(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function existingImage(image: MomentImageResponse): ComposerImage {
  return {
    localId: `existing-${image.id}`,
    response: null,
    existing: image,
    previewUrl: image.thumbnailUrl || image.fileUrl,
    name: image.originalName,
    altText: image.altText,
    status: "complete",
    progress: 100,
  };
}

export function MomentComposer({
  initialMoment,
  isSaving,
  onCancel,
  onSubmit,
}: MomentComposerProps) {
  const [content, setContent] = useState(initialMoment?.content ?? "");
  const [isPublished, setIsPublished] = useState(
    initialMoment ? initialMoment.visibility === "public" : true
  );
  const [images, setImages] = useState<ComposerImage[]>(() =>
    (initialMoment?.images ?? []).map(existingImage)
  );
  const [uploadFile] = useUploadFileMutation();
  const activeUploads = useRef(
    new Map<string, { abort: () => void; timer: ReturnType<typeof setInterval> }>()
  );
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    const uploads = activeUploads.current;
    const urls = objectUrls.current;
    return () => {
      uploads.forEach(({ abort, timer }) => {
        abort();
        clearInterval(timer);
      });
      uploads.clear();
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const updateImage = useCallback((localId: string, update: Partial<ComposerImage>) => {
    setImages((current) =>
      current.map((image) => (image.localId === localId ? { ...image, ...update } : image))
    );
  }, []);

  const uploadImage = useCallback(
    async (localId: string, file: File) => {
      activeUploads.current.get(localId)?.abort();
      const request = uploadFile(file);
      const timer = setInterval(() => {
        setImages((current) =>
          current.map((image) =>
            image.localId === localId && image.status === "uploading"
              ? { ...image, progress: Math.min(94, image.progress + 7) }
              : image
          )
        );
      }, 350);
      activeUploads.current.set(localId, { abort: request.abort, timer });
      updateImage(localId, { progress: 4, status: "uploading" });

      try {
        const response = await request.unwrap();
        if (response.id === undefined) {
          const errorMessage = "The Nexus API must be updated before this image can be attached.";
          updateImage(localId, {
            errorMessage,
            progress: 0,
            response: null,
            status: "failed",
          });
          toast.danger(errorMessage);
          return;
        }
        updateImage(localId, {
          errorMessage: undefined,
          progress: 100,
          response,
          status: "complete",
        });
        toast.success(`Uploaded ${file.name}.`);
      } catch {
        if (activeUploads.current.has(localId)) {
          updateImage(localId, {
            errorMessage: "Upload failed. Check the connection and try again.",
            progress: 0,
            status: "failed",
          });
          toast.danger(`Couldn't upload ${file.name}. You can retry it.`);
        }
      } finally {
        const active = activeUploads.current.get(localId);
        if (active) clearInterval(active.timer);
        activeUploads.current.delete(localId);
      }
    },
    [updateImage, uploadFile]
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        toast.warning("A moment can contain up to 9 images.");
        return;
      }

      const validFiles = files.filter((file) => {
        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
          toast.danger(`${file.name} must be JPEG, PNG, GIF, or WebP.`);
          return false;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          toast.danger(`${file.name} must be 10 MB or smaller.`);
          return false;
        }
        return true;
      });

      if (validFiles.length > remaining) {
        toast.warning(`Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added.`);
      }

      const additions = validFiles.slice(0, remaining).map((file, index) => {
        const localId = `${Date.now()}-${index}-${file.name}`;
        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.add(previewUrl);
        return {
          localId,
          file,
          response: null,
          existing: null,
          previewUrl,
          name: file.name,
          altText: defaultAltText(file.name),
          status: "uploading" as const,
          progress: 0,
        };
      });

      setImages((current) => [...current, ...additions]);
      additions.forEach((image) => {
        if (image.file) void uploadImage(image.localId, image.file);
      });
    },
    [images.length, uploadImage]
  );

  const handleSelect = useCallback(
    (fileList: FileList) => addFiles(Array.from(fileList)),
    [addFiles]
  );

  const handleDrop = useCallback(
    async (event: DropEvent) => {
      const droppedFiles: File[] = [];
      for (const item of event.items) {
        if (item.kind === "file" && item.getFile) droppedFiles.push(await item.getFile());
      }
      addFiles(droppedFiles);
    },
    [addFiles]
  );

  const removeImage = useCallback((localId: string) => {
    const active = activeUploads.current.get(localId);
    if (active) {
      active.abort();
      clearInterval(active.timer);
      activeUploads.current.delete(localId);
    }
    setImages((current) => {
      const target = current.find((image) => image.localId === localId);
      if (target?.file && objectUrls.current.has(target.previewUrl)) {
        URL.revokeObjectURL(target.previewUrl);
        objectUrls.current.delete(target.previewUrl);
      }
      return current.filter((image) => image.localId !== localId);
    });
  }, []);

  const moveImage = useCallback((index: number, direction: -1 | 1) => {
    setImages((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }, []);

  const hasIncompleteUploads = images.some((image) => image.status !== "complete");
  const hasMissingAlt = images.some((image) => !image.altText.trim());
  const canSubmit =
    content.trim().length > 0 && !hasIncompleteUploads && !hasMissingAlt && !isSaving;
  const characterCount = content.length;

  const imageRequests = useMemo(
    () =>
      images.map((image) => ({
        fileId: image.response?.id ?? image.existing?.fileId ?? 0,
        altText: image.altText.trim(),
      })),
    [images]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      content: content.trim(),
      images: imageRequests,
      visibility: isPublished ? "public" : "private",
    });
  };

  return (
    <Form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex w-full flex-col gap-5">
        <TextField isRequired className="flex flex-col gap-1.5" name="content">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-semibold">Moment</Label>
            <span className="text-muted text-xs tabular-nums">{characterCount} / 2000</span>
          </div>
          <TextArea
            className="min-h-36"
            maxLength={2000}
            placeholder="Share a small thing worth keeping…"
            value={content}
            variant="secondary"
            onChange={(event) => setContent(event.target.value)}
          />
        </TextField>

        <div className="flex flex-col gap-3">
          <div>
            <Typography weight="semibold" type="body-sm">
              Images
            </Typography>
            <Typography color="muted" type="body-xs">
              Up to 9 JPEG, PNG, GIF, or WebP images. Alt text is required before saving.
            </Typography>
          </div>

          {images.length < MAX_IMAGES ? (
            <DropZone className="w-full">
              <DropZone.Area onDrop={handleDrop}>
                <DropZone.Icon />
                <DropZone.Label>Drop images here or choose files</DropZone.Label>
                <DropZone.Description>
                  {MAX_IMAGES - images.length} slots remaining
                </DropZone.Description>
                <DropZone.Trigger>Select images</DropZone.Trigger>
              </DropZone.Area>
              <DropZone.Input
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp"
                onSelect={handleSelect}
              />
            </DropZone>
          ) : null}

          {images.length > 0 ? (
            <ol className="grid gap-3 sm:grid-cols-2">
              {images.map((image, index) => (
                <li
                  key={image.localId}
                  className="border-default-200 bg-surface rounded-2xl border p-3"
                >
                  <div className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      className="size-20 shrink-0 rounded-xl object-cover"
                      src={image.previewUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{image.name}</p>
                      <p
                        className={`text-xs ${image.status === "failed" ? "text-danger" : "text-muted"}`}
                      >
                        {image.status === "uploading" && `Uploading ${image.progress}%`}
                        {image.status === "complete" && `Image ${index + 1}`}
                        {image.status === "failed" && (image.errorMessage ?? "Upload failed")}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        <Tooltip>
                          <Button
                            isIconOnly
                            aria-label={`Move ${image.name} earlier`}
                            isDisabled={index === 0}
                            size="sm"
                            variant="ghost"
                            onPress={() => moveImage(index, -1)}
                          >
                            <Icon
                              aria-hidden="true"
                              className="size-4"
                              icon="gravity-ui:arrow-left"
                            />
                          </Button>
                          <Tooltip.Content>Move earlier</Tooltip.Content>
                        </Tooltip>
                        <Tooltip>
                          <Button
                            isIconOnly
                            aria-label={`Move ${image.name} later`}
                            isDisabled={index === images.length - 1}
                            size="sm"
                            variant="ghost"
                            onPress={() => moveImage(index, 1)}
                          >
                            <Icon
                              aria-hidden="true"
                              className="size-4"
                              icon="gravity-ui:arrow-right"
                            />
                          </Button>
                          <Tooltip.Content>Move later</Tooltip.Content>
                        </Tooltip>
                        {image.status === "failed" && image.file ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => uploadImage(image.localId, image.file!)}
                          >
                            Retry
                          </Button>
                        ) : null}
                        <Tooltip>
                          <Button
                            isIconOnly
                            aria-label={`Remove ${image.name}`}
                            size="sm"
                            variant="danger-soft"
                            onPress={() => removeImage(image.localId)}
                          >
                            <Icon
                              aria-hidden="true"
                              className="size-4"
                              icon="gravity-ui:trash-bin"
                            />
                          </Button>
                          <Tooltip.Content>Remove image</Tooltip.Content>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  <TextField isRequired className="mt-3" name={`alt-${image.localId}`}>
                    <Label className="sr-only">Alt text for {image.name}</Label>
                    <Input
                      aria-label={`Alt text for ${image.name}`}
                      maxLength={300}
                      placeholder="Describe this image"
                      value={image.altText}
                      onChange={(event) =>
                        updateImage(image.localId, { altText: event.target.value })
                      }
                    />
                  </TextField>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <Switch isSelected={isPublished} onChange={setIsPublished}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            Publish immediately to the public timeline
          </Switch.Content>
        </Switch>

        {hasIncompleteUploads ? (
          <p className="text-warning text-sm" role="status">
            Finish, retry, or remove every upload before saving this moment.
          </p>
        ) : null}
        {hasMissingAlt ? (
          <p className="text-danger text-sm" role="alert">
            Add alt text for every image.
          </p>
        ) : null}
      </div>

      <div className="border-default-200 flex w-full justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onPress={onCancel}>
          Cancel
        </Button>
        <Button isDisabled={!canSubmit} type="submit" variant="primary">
          {isSaving ? <Spinner size="sm" /> : initialMoment ? "Save changes" : "Create moment"}
        </Button>
      </div>
    </Form>
  );
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Button,
  AlertDialog,
  Spinner,
  Chip,
  Tooltip,
} from "@heroui/react";
import { DropZone, useDropZonePickerContext } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

import {
  useUploadFileMutation,
  useDeleteFileMutation,
} from "@/lib/features/file/file-api";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "complete" | "failed";
  progress: number;
  url?: string;
  fileName?: string;
}

// Format file size helper (using tabular-nums)
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1) : "";
}

type FileFormatColor = "blue" | "gray" | "green" | "orange" | "purple" | "red";

function getFormatColor(ext: string): FileFormatColor {
  const map: Record<string, FileFormatColor> = {
    csv: "green",
    doc: "blue",
    docx: "blue",
    fig: "purple",
    jpeg: "blue",
    jpg: "blue",
    json: "orange",
    mp4: "purple",
    pdf: "red",
    png: "green",
    svg: "green",
    ts: "blue",
    tsx: "blue",
    txt: "gray",
    xlsx: "green",
    zip: "orange",
  };
  return map[ext.toLowerCase()] ?? "gray";
}

function UploadTrigger() {
  const { openFilePicker } = useDropZonePickerContext();
  return (
    <Button variant="primary" onPress={openFilePicker} size="sm" className="mt-2">
      Add Asset File
    </Button>
  );
}

export function FilesPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [copiedFileName, setCopiedFileName] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<UploadFile | null>(null);

  const [uploadFile] = useUploadFileMutation();
  const [deleteFile, { isLoading: isDeleting }] = useDeleteFileMutation();

  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Initialize uploaded assets from localStorage for persistence in admin panel
  useEffect(() => {
    const saved = localStorage.getItem("odyssey_dashboard_files");
    if (saved) {
      try {
        setFiles(JSON.parse(saved));
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  useEffect(() => {
    const ref = timersRef.current;
    return () => {
      ref.forEach((timer) => clearInterval(timer));
      ref.clear();
    };
  }, []);

  const saveFilesToLocal = (updatedFiles: UploadFile[]) => {
    setFiles(updatedFiles);
    localStorage.setItem("odyssey_dashboard_files", JSON.stringify(updatedFiles));
  };

  // Execute file upload
  const executeUpload = async (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newFile: UploadFile = {
      id,
      name: file.name,
      size: file.size,
      status: "uploading",
      progress: 0,
    };

    setFiles((prev) => [newFile, ...prev]);

    // Simulate progress bar increments
    const timer = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== id || f.status !== "uploading") return f;
          const next = Math.min(f.progress + Math.floor(Math.random() * 15) + 5, 90);
          return { ...f, progress: next };
        })
      );
    }, 200);

    timersRef.current.set(id, timer);

    try {
      const res = await uploadFile(file).unwrap();
      
      const t = timersRef.current.get(id);
      if (t) clearInterval(t);
      timersRef.current.delete(id);

      setFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.id === id) {
            return {
              ...f,
              status: "complete" as const,
              progress: 100,
              url: res.fileUrl,
              fileName: res.fileName,
            };
          }
          return f;
        });
        saveFilesToLocal(updated);
        return updated;
      });
    } catch {
      const t = timersRef.current.get(id);
      if (t) clearInterval(t);
      timersRef.current.delete(id);

      setFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.id === id) {
            return { ...f, status: "failed" as const, progress: 0 };
          }
          return f;
        });
        saveFilesToLocal(updated);
        return updated;
      });
    }
  };

  // 1. Handle DropZone drop upload
  const handleDrop = useCallback(
    async (e: { items: Array<{ kind: string; getFile?: () => Promise<File> }> }) => {
      const dropped: File[] = [];
      for (const item of e.items) {
        if (item.kind === "file" && item.getFile) {
          dropped.push(await item.getFile());
        }
      }
      if (dropped.length > 0) {
        await executeUpload(dropped[0]);
      }
    },
    [files]
  );

  // 2. Handle DropZone input selection upload
  const handleSelect = useCallback(
    async (fileList: FileList) => {
      if (fileList && fileList[0]) {
        await executeUpload(fileList[0]);
      }
    },
    [files]
  );

  // Retry upload
  const handleRetry = async (fileItem: UploadFile) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
  };

  // Remove file (open confirmation dialog)
  const handleRemoveClick = (fileItem: UploadFile) => {
    setFileToDelete(fileItem);
  };

  // Delete confirmation
  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
      try {
        const nameToDelete = fileToDelete.fileName || fileToDelete.name;
        await deleteFile(nameToDelete).unwrap();
        const updated = files.filter((f) => f.id !== fileToDelete.id);
        saveFilesToLocal(updated);
        setFileToDelete(null);
      } catch {
        // Handled globally
      }
    }
  };

  // Copy URL link
  const handleCopyLink = (file: UploadFile) => {
    if (file.url) {
      navigator.clipboard.writeText(file.url);
      setCopiedFileName(file.name);
      setTimeout(() => setCopiedFileName(null), 2000);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="border-border flex flex-col gap-2 border-b pb-4">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Static Assets Library</h1>
        <p className="text-muted mt-1 text-sm">
          Upload, organize, and preview your media assets. Generated CDN/external links can be used as post covers and rich-text illustrations.
        </p>
      </div>

      {/* Official DropZone UI */}
      <DropZone className="w-full">
        <DropZone.Area onDrop={handleDrop as any}>
          <DropZone.Icon />
          <DropZone.Label>Drag assets here or click to browse</DropZone.Label>
          <DropZone.Description>Supports JPEG, PNG, or PDF formats up to 10 MB.</DropZone.Description>
          <UploadTrigger />
        </DropZone.Area>
        <DropZone.Input accept="image/*,application/pdf" onSelect={handleSelect} />

        {/* Official standard DropZone.FileList rendering */}
        {files.length > 0 && (
          <DropZone.FileList>
            {files.map((file) => {
              const ext = getExtension(file.name).toUpperCase();
              const isCopied = copiedFileName === file.name;

              return (
                <DropZone.FileItem key={file.id} status={file.status}>
                  <DropZone.FileFormatIcon color={getFormatColor(ext.toLowerCase())} format={ext} />
                  <DropZone.FileInfo>
                    <DropZone.FileName>{file.name}</DropZone.FileName>
                    <DropZone.FileMeta>
                      {formatFileSize(file.size)}
                      {file.status === "uploading" && ` | Uploading... ${file.progress}%`}
                      {file.status === "complete" && (
                        <span className="text-success inline-flex items-center gap-1">
                          {" | "}
                          <Icon icon="gravity-ui:circle-check-fill" className="size-3 text-success inline" aria-hidden="true" />
                          {" Success"}
                        </span>
                      )}
                      {file.status === "failed" && (
                        <span className="text-danger inline-flex items-center gap-1">
                          {" | "}
                          <Icon icon="gravity-ui:circle-xmark-fill" className="size-3 text-danger inline" aria-hidden="true" />
                          {" Failed"}
                        </span>
                      )}
                    </DropZone.FileMeta>
                    
                    {/* Upload progress bar */}
                    {(file.status === "uploading" || file.status === "complete") && (
                      <DropZone.FileProgress value={file.progress}>
                        <DropZone.FileProgressTrack>
                          <DropZone.FileProgressFill />
                        </DropZone.FileProgressTrack>
                      </DropZone.FileProgress>
                    )}
                    
                    {/* Failed retry trigger */}
                    {file.status === "failed" && (
                      <Button
                        className="-ml-1 mt-2 text-xs"
                        size="sm"
                        variant="danger-soft"
                        onPress={() => handleRetry(file)}
                      >
                        Try Again
                      </Button>
                    )}
                  </DropZone.FileInfo>

                  {/* Actions (Copy Link / New Tab Preview) */}
                  {file.status === "complete" && file.url && (
                    <div className="flex items-center gap-1 mr-1">
                      <Tooltip delay={0}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => handleCopyLink(file)}
                          aria-label="Copy Link"
                          className="size-7"
                        >
                          <Icon
                            icon={isCopied ? "gravity-ui:check" : "gravity-ui:copy"}
                            className={`size-3.5 ${isCopied ? "text-success" : "text-muted"}`}
                            aria-hidden="true"
                          />
                        </Button>
                        <Tooltip.Content>{isCopied ? "Link Copied!" : "Copy External Link"}</Tooltip.Content>
                      </Tooltip>
                      <Tooltip delay={0}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => window.open(file.url, "_blank")}
                          aria-label="Preview"
                          className="size-7"
                        >
                          <Icon icon="gravity-ui:arrow-up-right-from-square" className="text-muted size-3.5" aria-hidden="true" />
                        </Button>
                        <Tooltip.Content>Open in New Tab</Tooltip.Content>
                      </Tooltip>
                    </div>
                  )}

                  <DropZone.FileRemoveTrigger
                    aria-label={`Remove ${file.name}`}
                    onPress={() => handleRemoveClick(file)}
                  />
                </DropZone.FileItem>
              );
            })}
          </DropZone.FileList>
        )}
      </DropZone>

      {/* Delete Confirmation Alert */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={!!fileToDelete}
          onOpenChange={(open) => !open && setFileToDelete(null)}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Asset?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                Are you sure you want to permanently delete the asset <span className="font-semibold text-foreground">"{fileToDelete?.name}"</span> from the server?
                This action cannot be undone and all posts referenced by this URL will break.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setFileToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onPress={handleDeleteConfirm} isDisabled={isDeleting}>
                  {isDeleting ? <Spinner size="sm" className="text-white" /> : "Delete"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

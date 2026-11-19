"use client";

import {
  AlertDialog,
  Button,
  Input,
  Label,
  Spinner,
  TextField,
  Tooltip,
  toast,
} from "@heroui/react";
import { DropZone, useDropZonePickerContext } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useClipboard } from "@mantine/hooks";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useState } from "react";

import {
  type AssetUsage,
  type FileResponse,
  useDeleteFileMutation,
  useGetFileUsageQuery,
  useSearchFilesQuery,
  useUploadFileMutation,
} from "@/lib/features/file";

import { StorageHealth } from "./storage-health";

const PAGE_SIZE = 20;
type Upload = { id: string; file: File; status: "uploading" | "failed" };

const usageLabels: Record<AssetUsage["locations"][number]["kind"], string> = {
  ARTICLE_COVER: "Article cover",
  ARTICLE_CONTENT: "Article body",
  ARTICLE_SUMMARY: "Article summary",
  COMMENT: "Comment",
  USER_AVATAR: "User avatar",
  PROJECT_COVER: "Project cover",
  SERIES_COVER: "Column cover",
  FRIEND_LINK_AVATAR: "Friend link avatar",
  ARTICLE_REVISION: "Article revision",
  MOMENT: "Moment",
};

function formatFileSize(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(
    units.length - 1,
    Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024))
  );
  const amount = bytes / 1024 ** unit;
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${units[unit]}`;
}

function UploadTrigger() {
  const { openFilePicker } = useDropZonePickerContext();
  return (
    <Button size="sm" variant="primary" onPress={openFilePicker}>
      Add asset
    </Button>
  );
}

export function FilesPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [fileToDelete, setFileToDelete] = useState<FileResponse | null>(null);

  const files = useSearchFilesQuery(
    { keyword: search || undefined, page, size: PAGE_SIZE, sort: ["createdAt,desc", "id,desc"] },
    { refetchOnMountOrArgChange: true }
  );
  const [uploadFile] = useUploadFileMutation();
  const [deleteFile, { isLoading: isDeleting }] = useDeleteFileMutation();
  const clipboard = useClipboard();
  const usage = useGetFileUsageQuery(fileToDelete?.fileName ?? skipToken, {
    refetchOnMountOrArgChange: true,
  });
  const locations = usage.currentData;
  const canDelete = !usage.isFetching && !usage.isError && locations?.total === 0;

  useEffect(() => {
    if (clipboard.error) toast.danger("Couldn’t copy the file link.");
    else if (clipboard.copied) toast.success("File link copied.");
  }, [clipboard.error, clipboard.copied]);

  async function executeUpload(file: File, retryId?: string) {
    const id = retryId ?? crypto.randomUUID();
    const upload: Upload = { id, file, status: "uploading" };
    setUploads((current) =>
      retryId ? current.map((item) => (item.id === id ? upload : item)) : [...current, upload]
    );
    try {
      await uploadFile(file).unwrap();
      setUploads((current) => current.filter((item) => item.id !== id));
      toast.success("Asset uploaded.");
    } catch {
      setUploads((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "failed" } : item))
      );
    }
  }

  async function confirmDelete() {
    if (!fileToDelete || !canDelete || isDeleting) return;
    try {
      await deleteFile(fileToDelete.fileName).unwrap();
    } catch {
      void usage.refetch();
      return;
    }
    setFileToDelete(null);
    if (page > 0 && files.currentData?.list.length === 1) {
      const refreshed = await files.refetch();
      if (refreshed.data) {
        const lastPage = Math.max(0, refreshed.data.totalPages - 1);
        setPage((current) => (current === page ? Math.min(current, lastPage) : current));
      }
    }
  }

  const result = files.currentData;
  const totalPages = result?.totalPages ?? 0;

  return (
    <div className="animate-fade-in mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
      <h1 className="text-foreground text-2xl font-bold tracking-tight">Static Assets Library</h1>

      <StorageHealth />

      <DropZone className="w-full">
        <DropZone.Area
          onDrop={async (event) => {
            const file = event.items.find((item) => item.kind === "file");
            if (!file) return;
            try {
              await executeUpload(await file.getFile());
            } catch {
              toast.danger("Couldn’t read the dropped file.");
            }
          }}
        >
          <DropZone.Icon />
          <DropZone.Label>Drag an asset here or browse files</DropZone.Label>
          <DropZone.Description>Images or PDFs up to 10 MB.</DropZone.Description>
          <UploadTrigger />
        </DropZone.Area>
        <DropZone.Input
          accept="image/*,application/pdf"
          onSelect={(selected) => {
            if (selected[0]) void executeUpload(selected[0]);
          }}
        />
        {uploads.length > 0 && (
          <DropZone.FileList>
            {uploads.map(({ id, file, status }) => (
              <DropZone.FileItem key={id} status={status}>
                <DropZone.FileInfo>
                  <DropZone.FileName>{file.name}</DropZone.FileName>
                  <DropZone.FileMeta>
                    {status === "uploading" ? "Uploading…" : "Upload failed"}
                  </DropZone.FileMeta>
                </DropZone.FileInfo>
                {status === "uploading" ? (
                  <Spinner size="sm" aria-label={`Uploading ${file.name}`} />
                ) : (
                  <>
                    <Button size="sm" variant="secondary" onPress={() => executeUpload(file, id)}>
                      Retry upload
                    </Button>
                    <DropZone.FileRemoveTrigger
                      aria-label={`Dismiss failed upload ${file.name}`}
                      onPress={() =>
                        setUploads((current) => current.filter((item) => item.id !== id))
                      }
                    />
                  </>
                )}
              </DropZone.FileItem>
            ))}
          </DropZone.FileList>
        )}
      </DropZone>

      <section aria-labelledby="asset-list-title" className="flex flex-col gap-3">
        <h2 id="asset-list-title" className="text-lg font-semibold">
          Asset files
        </h2>
        <form
          role="search"
          aria-label="Search asset files"
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(keyword.trim());
            setPage(0);
          }}
        >
          <TextField className="min-w-32 flex-1" value={keyword} onChange={setKeyword}>
            <Label>Filename</Label>
            <Input placeholder="Search by filename" />
          </TextField>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {search && (
            <Button
              variant="ghost"
              onPress={() => {
                setKeyword("");
                setSearch("");
                setPage(0);
              }}
            >
              Clear
            </Button>
          )}
        </form>

        {files.isError ? (
          <div className="flex items-center gap-3" role="status">
            <p className="text-muted text-sm">Couldn’t load asset files.</p>
            <Button size="sm" variant="secondary" onPress={() => files.refetch()}>
              Retry list
            </Button>
          </div>
        ) : files.isFetching ? (
          <div role="status" className="flex items-center gap-2 py-3">
            <Spinner size="sm" />
            <span className="text-muted text-sm">Loading asset files…</span>
          </div>
        ) : result?.list.length ? (
          <ul className="divide-border border-border divide-y rounded-xl border">
            {result.list.map((file) => (
              <li key={file.fileName} className="flex items-center gap-3 p-3">
                <Icon icon="gravity-ui:file" className="text-muted size-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-muted text-xs tabular-nums">{formatFileSize(file.fileSize)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Copy link for ${file.originalName}`}
                      onPress={() => clipboard.copy(file.fileUrl)}
                    >
                      <Icon icon="gravity-ui:copy" aria-hidden />
                    </Button>
                    <Tooltip.Content>Copy link</Tooltip.Content>
                  </Tooltip>
                  <Tooltip>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Preview ${file.originalName}`}
                      onPress={() => window.open(file.fileUrl, "_blank", "noopener,noreferrer")}
                    >
                      <Icon icon="gravity-ui:arrow-up-right-from-square" aria-hidden />
                    </Button>
                    <Tooltip.Content>Open in a new tab</Tooltip.Content>
                  </Tooltip>
                  <Tooltip>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${file.originalName}`}
                      onPress={() => setFileToDelete(file)}
                    >
                      <Icon icon="gravity-ui:trash-bin" aria-hidden />
                    </Button>
                    <Tooltip.Content>Delete asset</Tooltip.Content>
                  </Tooltip>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p role="status" className="text-muted py-3 text-sm">
            {search ? "No assets match this filename." : "No assets on this page."}
          </p>
        )}
        {(page > 0 || totalPages > 1) && (
          <nav aria-label="Asset pages" className="flex flex-wrap items-center gap-2">
            <Button
              isDisabled={page === 0 || files.isFetching}
              onPress={() => setPage((current) => current - 1)}
              size="sm"
              variant="secondary"
            >
              Previous
            </Button>
            <span className="text-muted text-sm">
              Page {page + 1}
              {totalPages > page ? ` of ${totalPages}` : ""}
            </span>
            <Button
              isDisabled={page + 1 >= totalPages || files.isFetching}
              onPress={() => setPage((current) => current + 1)}
              size="sm"
              variant="secondary"
            >
              Next
            </Button>
          </nav>
        )}
      </section>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={fileToDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setFileToDelete(null);
          }}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete asset?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="font-semibold">{fileToDelete?.originalName}</p>
                {usage.isFetching ? (
                  <p role="status">Checking where this asset is used…</p>
                ) : usage.isError ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p role="status">Couldn’t check usage. The asset cannot be deleted yet.</p>
                    <Button size="sm" variant="secondary" onPress={() => usage.refetch()}>
                      Retry usage check
                    </Button>
                  </div>
                ) : locations?.total ? (
                  <div className="flex min-w-0 flex-col gap-2">
                    <p role="status">This asset is in use and cannot be deleted.</p>
                    <ul
                      className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5"
                      aria-label="Usage locations"
                    >
                      {locations.locations.map(({ kind, id, label }) => (
                        <li key={`${kind}-${id}`} className="break-words">
                          {usageLabels[kind]} · {label || `#${id}`}
                        </li>
                      ))}
                    </ul>
                    {locations.total > locations.locations.length && (
                      <p>And {locations.total - locations.locations.length} more.</p>
                    )}
                  </div>
                ) : locations ? (
                  <p>Removing the last reference permanently deletes the file.</p>
                ) : null}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  isDisabled={isDeleting}
                  variant="ghost"
                  onPress={() => setFileToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={confirmDelete}
                  isDisabled={isDeleting || !canDelete}
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

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

// 格式化文件大小辅助函数 (使用等宽数字)
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
      添加素材文件
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

  // 从 localStorage 初始化文件列表库，保持隔离测试持久化
  useEffect(() => {
    const saved = localStorage.getItem("odyssey_dashboard_files");
    if (saved) {
      try {
        setFiles(JSON.parse(saved));
      } catch {
        // 忽略解析失败
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

  // 执行文件上传
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

    // 模拟文件上传进度条递增
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

  // 1. 处理 DropZone 拖放上传
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

  // 2. 处理 DropZone 原生文件选择器文件
  const handleSelect = useCallback(
    async (fileList: FileList) => {
      if (fileList && fileList[0]) {
        await executeUpload(fileList[0]);
      }
    },
    [files]
  );

  // 重试上传
  const handleRetry = async (fileItem: UploadFile) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
  };

  // 移除文件 (打开删除对话框)
  const handleRemoveClick = (fileItem: UploadFile) => {
    setFileToDelete(fileItem);
  };

  // 删除确认逻辑
  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
      try {
        const nameToDelete = fileToDelete.fileName || fileToDelete.name;
        await deleteFile(nameToDelete).unwrap();
        const updated = files.filter((f) => f.id !== fileToDelete.id);
        saveFilesToLocal(updated);
        setFileToDelete(null);
      } catch {
        // 异常已全局拦截
      }
    }
  };

  // 复制链接
  const handleCopyLink = (file: UploadFile) => {
    if (file.url) {
      navigator.clipboard.writeText(file.url);
      setCopiedFileName(file.name);
      setTimeout(() => setCopiedFileName(null), 2000);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 animate-fade-in">
      {/* 头部标题区 */}
      <div className="border-border flex flex-col gap-2 border-b pb-4">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">静态素材库</h1>
        <p className="text-muted mt-1 text-sm">
          上传、组织和预览媒体文件。生成的静态外链地址可用于文章插图、封面及富文本插图。
        </p>
      </div>

      {/* 官方标准 DropZone UI */}
      <DropZone className="w-full">
        <DropZone.Area onDrop={handleDrop as any}>
          <DropZone.Icon />
          <DropZone.Label>将文件拖拽至此，或点击浏览</DropZone.Label>
          <DropZone.Description>支持 JPEG, PNG, PDF 格式，最大不超过 10 MB。</DropZone.Description>
          <UploadTrigger />
        </DropZone.Area>
        <DropZone.Input accept="image/*,application/pdf" onSelect={handleSelect} />

        {/* 官方标准 DropZone.FileList 列表渲染 */}
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
                      {file.status === "uploading" && ` | 正在上传... ${file.progress}%`}
                      {file.status === "complete" && (
                        <span className="text-success inline-flex items-center gap-1">
                          {" | "}
                          <Icon icon="gravity-ui:circle-check-fill" className="size-3 text-success inline" aria-hidden="true" />
                          {" 成功"}
                        </span>
                      )}
                      {file.status === "failed" && (
                        <span className="text-danger inline-flex items-center gap-1">
                          {" | "}
                          <Icon icon="gravity-ui:circle-xmark-fill" className="size-3 text-danger inline" aria-hidden="true" />
                          {" 失败"}
                        </span>
                      )}
                    </DropZone.FileMeta>
                    
                    {/* 上传进度条 */}
                    {(file.status === "uploading" || file.status === "complete") && (
                      <DropZone.FileProgress value={file.progress}>
                        <DropZone.FileProgressTrack>
                          <DropZone.FileProgressFill />
                        </DropZone.FileProgressTrack>
                      </DropZone.FileProgress>
                    )}
                    
                    {/* 失败重试 */}
                    {file.status === "failed" && (
                      <Button
                        className="-ml-1 mt-2 text-xs"
                        size="sm"
                        variant="danger-soft"
                        onPress={() => handleRetry(file)}
                      >
                        重新尝试
                      </Button>
                    )}
                  </DropZone.FileInfo>

                  {/* 自定义辅助行动点 (复制外链 / 新窗口预览) - 紧跟在删除按钮左侧 */}
                  {file.status === "complete" && file.url && (
                    <div className="flex items-center gap-1 mr-1">
                      <Tooltip delay={0}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => handleCopyLink(file)}
                          aria-label="复制链接"
                          className="size-7"
                        >
                          <Icon
                            icon={isCopied ? "gravity-ui:check" : "gravity-ui:copy"}
                            className={`size-3.5 ${isCopied ? "text-success" : "text-muted"}`}
                            aria-hidden="true"
                          />
                        </Button>
                        <Tooltip.Content>{isCopied ? "已复制链接！" : "复制外链地址"}</Tooltip.Content>
                      </Tooltip>
                      <Tooltip delay={0}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          onPress={() => window.open(file.url, "_blank")}
                          aria-label="预览"
                          className="size-7"
                        >
                          <Icon icon="gravity-ui:arrow-up-right-from-square" className="text-muted size-3.5" aria-hidden="true" />
                        </Button>
                        <Tooltip.Content>新窗口打开</Tooltip.Content>
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

      {/* 删除素材确认 AlertDialog */}
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
                <AlertDialog.Heading>删除素材确认</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                你确定要从服务器上永久删除素材 <span className="font-semibold text-foreground">"{fileToDelete?.name}"</span> 吗？
                此操作将无法撤销，所有引用此 URL 的文章和插图都将失效。
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setFileToDelete(null)}>
                  取消
                </Button>
                <Button variant="danger" onPress={handleDeleteConfirm} isDisabled={isDeleting}>
                  {isDeleting ? <Spinner size="sm" className="text-white" /> : "确定删除"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

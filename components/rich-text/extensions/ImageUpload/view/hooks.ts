"use client";

import { toast } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useUploadFileMutation } from "@/lib/features/file";
import { validateMediaFile } from "../../media/media-upload";

export function useImageUploader({ onUpload }: { onUpload: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [uploadFile] = useUploadFileMutation();
  const abortRef = useRef<(() => void) | null>(null);

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateMediaFile(file, "image");
      if (validationError) {
        toast.warning(validationError);
        setError(validationError);
        setActiveFile(file);
        return;
      }

      abortRef.current?.();
      setError(null);
      setActiveFile(file);
      setLoading(true);

      const request = uploadFile(file);
      abortRef.current = request.abort;

      try {
        const response = await request.unwrap();
        onUpload(response.fileUrl);
      } catch {
        const message = "Upload failed. Try again.";
        setError(message);
        toast.danger(message);
      } finally {
        abortRef.current = null;
        setLoading(false);
      }
    },
    [onUpload, uploadFile]
  );

  const retry = useCallback(() => {
    if (activeFile) void upload(activeFile);
  }, [activeFile, upload]);

  const clear = useCallback(() => {
    abortRef.current?.();
    abortRef.current = null;
    setActiveFile(null);
    setError(null);
    setLoading(false);
  }, []);

  return { activeFile, clear, error, loading, retry, upload };
}

export function useAutoUploadPendingFile({
  file,
  upload,
}: {
  file: File | null;
  upload: (file: File) => Promise<void> | void;
}) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!file || startedRef.current) return;
    startedRef.current = true;
    void upload(file);
  }, [file, upload]);
}

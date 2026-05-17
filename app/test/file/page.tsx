"use client";

import React, { useState, useRef } from "react";
import { Card, Button, Separator, Alert, Typography, Table } from "@heroui/react";
import { useUploadFileMutation, useDeleteFileMutation } from "@/lib/features/file";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function FileTestPage() {
  const mounted = useMounted();
  const isAdmin = useAppSelector(selectIsAdmin);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Mutations
  const [uploadFile, { isLoading: isUploading, error: uploadError }] = useUploadFileMutation();
  const [deleteFile, { isLoading: isDeleting }] = useDeleteFileMutation();

  if (!mounted) return null;

  const getErrorMessage = (error: any) => {
    return typeof error === "string" ? error : "An unexpected error occurred";
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file).unwrap();
      setUploadedFiles((prev) => [...prev, result]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {}
  };

  const handleDelete = async (fileName: string) => {
    try {
      await deleteFile(fileName).unwrap();
      setUploadedFiles((prev) => prev.filter((f) => f.fileName !== fileName));
    } catch (err) {}
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Admin File Management Test Page
      </Typography>

      {!isAdmin ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Access Denied</Alert.Title>
            <Alert.Description>Please login as an admin to test file uploads.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Card */}
          <Card className="lg:col-span-1 h-fit">
            <Card.Header>
              <Card.Title>Upload File</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              {uploadError && (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Upload Error</Alert.Title>
                    <Alert.Description>{getErrorMessage(uploadError)}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}
              <div
                className="border-2 border-dashed border-default-300 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-default-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold">Click to select file</p>
                  <p className="text-xs text-muted">Supports all file types</p>
                </div>
                {isUploading && <p className="text-xs text-primary animate-pulse">Uploading...</p>}
              </div>
            </Card.Content>
          </Card>

          {/* Uploaded Files Table */}
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>Session Uploads</Card.Title>
            </Card.Header>
            <Card.Content>
              <Table aria-label="Uploaded files during this session">
                <Table.ScrollContainer>
                  <Table.Content>
                    <Table.Header>
                      <Table.Column isRowHeader>PREVIEW</Table.Column>
                      <Table.Column>NAME</Table.Column>
                      <Table.Column>SIZE</Table.Column>
                      <Table.Column>ACTIONS</Table.Column>
                    </Table.Header>
                    <Table.Body renderEmptyState={() => "No files uploaded in this session."}>
                      {uploadedFiles.map((file) => (
                        <Table.Row key={file.fileName}>
                          <Table.Cell>
                            {file.fileType.startsWith("image/") ? (
                              <img
                                src={file.fileUrl}
                                alt={file.fileName}
                                className="size-10 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="size-10 bg-default-100 rounded-lg flex items-center justify-center text-[10px] uppercase font-bold">
                                {file.fileType.split("/")[1] || "FILE"}
                              </div>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <div className="max-w-[200px] truncate" title={file.fileName}>
                              {file.fileName}
                            </div>
                          </Table.Cell>
                          <Table.Cell>{(file.fileSize / 1024).toFixed(2)} KB</Table.Cell>
                          <Table.Cell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onPress={() => window.open(file.fileUrl, "_blank")}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                isLoading={isDeleting}
                                onPress={() => handleDelete(file.fileName)}
                              >
                                Delete
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}

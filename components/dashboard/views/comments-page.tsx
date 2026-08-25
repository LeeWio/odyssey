"use client";

import {
  AlertDialog,
  Avatar,
  AvatarFallback,
  Button,
  Label,
  ListBox,
  Select,
  Spinner,
  Tabs,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCallback, useMemo, useState } from "react";

import {
  type CommentResponse,
  type CommentStatus,
  useDeleteCommentMutation,
  useGetAdminCommentsQuery,
  useModerateCommentMutation,
} from "@/lib/features/comment";
import { CommentSystem } from "@/components/comment";
import { useGetPublicPostsQuery } from "@/features/blog";

export function CommentsPage() {
  const [activeTab, setActiveTab] = useState<string>("admin"); // Default to admin moderation inside admin panel

  // --- Public Tab State ---
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const { data: postsData, isLoading: isPostsLoading } = useGetPublicPostsQuery({
    page: 0,
    size: 50,
  });
  const posts = postsData?.list || [];

  // --- Admin Tab State ---
  const [adminSort, setAdminSort] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });
  const [commentToDelete, setCommentToDelete] = useState<CommentResponse | null>(null);

  const { data: adminCommentsData, isLoading: isAdminCommentsLoading } = useGetAdminCommentsQuery({
    page: 0,
    size: 50,
  });

  const [moderateComment] = useModerateCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();

  const handleModerate = useCallback(
    async (id: number, status: CommentStatus) => {
      await moderateComment({ id, status });
    },
    [moderateComment]
  );

  const handleDeleteConfirm = async () => {
    if (commentToDelete) {
      await deleteComment(commentToDelete.id);
      setCommentToDelete(null);
    }
  };

  const sortedAdminComments = useMemo(() => {
    const list = adminCommentsData?.list || [];
    const col = adminSort.column as keyof CommentResponse;
    return [...list].sort((a, b) => {
      const first = a[col] ?? "";
      const second = b[col] ?? "";
      const cmp = String(first).localeCompare(String(second));
      return adminSort.direction === "descending" ? -cmp : cmp;
    });
  }, [adminCommentsData?.list, adminSort]);

  const adminColumns = useMemo<DataGridColumn<CommentResponse>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        id: "id",
        minWidth: 80,
        isRowHeader: true,
        cell: (item) => <span className="font-medium tabular-nums">{item.id}</span>,
      },
      {
        accessorKey: "username",
        header: "User",
        id: "username",
        minWidth: 140,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{item.username?.[0]?.toUpperCase() || "A"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">{item.username}</span>
          </div>
        ),
      },
      {
        accessorKey: "content",
        header: "Content",
        id: "content",
        minWidth: 280,
        cell: (item) => <span className="line-clamp-2 text-sm">{item.content}</span>,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        header: "Created At",
        id: "createdAt",
        minWidth: 160,
        cell: (item) => (
          <span className="text-muted text-sm tabular-nums">
            {new Date(item.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        align: "end",
        header: "Actions",
        id: "actions",
        minWidth: 260,
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="tertiary"
              className="text-success"
              onPress={() => handleModerate(item.id, "APPROVED")}
            >
              <Icon icon="gravity-ui:check" className="size-4" aria-hidden="true" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              className="text-danger"
              onPress={() => handleModerate(item.id, "REJECTED")}
            >
              <Icon icon="gravity-ui:xmark" className="size-4" aria-hidden="true" />
              Reject
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="danger-soft"
              onPress={() => setCommentToDelete(item)}
            >
              <Icon icon="gravity-ui:trash-bin" className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ),
      },
    ],
    [handleModerate]
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="border-border flex flex-col gap-2 border-b pb-4">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Comment Moderation</h1>
        <p className="text-muted mt-1 text-sm">
          Approve, reject, or delete comments across all blog posts with administrative privileges.
        </p>
      </div>

      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Comment views">
            <Tabs.Tab id="admin">
              Moderation Console
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="public">
              Thread Preview
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {/* Public Tab */}
      {activeTab === "public" && (
        <div className="flex flex-col gap-6">
          <Select
            className="w-full sm:w-[320px]"
            placeholder={
              isPostsLoading ? "Loading posts..." : "Select a post to preview the comment thread"
            }
            isDisabled={isPostsLoading}
            value={selectedPostId?.toString() || null}
            onChange={(val) => {
              if (val) {
                setSelectedPostId(Number(val));
              } else {
                setSelectedPostId(null);
              }
            }}
          >
            <Label>Selected Post</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {posts.map((post) => (
                  <ListBox.Item key={post.id} id={post.id.toString()} textValue={post.title}>
                    {post.title}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {selectedPostId && (
            <CommentSystem postId={selectedPostId}>
              {({ commentList, commentInput, totalCount }) => (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">Comment Thread</h3>
                    <span className="text-muted text-sm tabular-nums">
                      {totalCount} {totalCount === 1 ? "comment" : "comments"}
                    </span>
                  </div>
                  {commentList}
                  {commentInput}
                </div>
              )}
            </CommentSystem>
          )}
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === "admin" && (
        <div className="bg-surface border-border overflow-hidden rounded-2xl border">
          <DataGrid
            aria-label="Admin Comments"
            columns={adminColumns}
            contentClassName="min-w-[900px]"
            data={sortedAdminComments}
            getRowId={(item) => item.id}
            isLoadingMore={isAdminCommentsLoading}
            sortDescriptor={adminSort}
            onSortChange={setAdminSort}
          />
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={!!commentToDelete}
          onOpenChange={(open) => !open && setCommentToDelete(null)}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md" aria-label="Alert dialog">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Comment?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                Are you sure you want to permanently delete this comment? This action cannot be
                undone and will remove the comment from the public timeline.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setCommentToDelete(null)}>
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

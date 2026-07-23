"use client";

import { useMemo, useState, FormEvent, useCallback } from "react";
import {
  Button,
  Form,
  TextField,
  Label,
  TextArea,
  AlertDialog,
  Spinner,
  Tabs,
  Select,
  ListBox,
  Avatar,
  AvatarFallback,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

import {
  useGetPostCommentsQuery,
  usePublishCommentMutation,
  useGetAdminCommentsQuery,
  useGetPendingCommentsQuery,
  useModerateCommentMutation,
  useDeleteCommentMutation,
  type CommentResponse,
  type CommentStatus,
} from "@/lib/features/comment/comment-api";
import { useGetPublicPostsQuery } from "@/lib/features/post/post-api";
import { CommentSystem } from "@/components/comment";

// --- Recursive Component for Public Comments ---
function CommentTreeItem({
  comment,
  onReply,
}: {
  comment: CommentResponse;
  onReply: (c: CommentResponse) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Avatar size="sm" className="mt-1 shrink-0">
          <AvatarFallback>{comment.username?.[0]?.toUpperCase() || "A"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{comment.username}</span>
              <span className="text-muted text-xs tabular-nums">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <Button size="sm" variant="ghost" onPress={() => onReply(comment)} className="text-xs">
              <Icon icon="gravity-ui:reply" className="size-3.5" aria-hidden="true" />
              Reply
            </Button>
          </div>
          <div className="text-foreground/90 text-sm leading-relaxed">{comment.content}</div>
        </div>
      </div>
      {comment.children && comment.children.length > 0 && (
        <div className="border-border ml-4 flex flex-col gap-6 border-l pl-6">
          {comment.children.map((child) => (
            <CommentTreeItem key={child.id} comment={child} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentTestPage() {
  const [activeTab, setActiveTab] = useState<string>("public");

  // --- Public Tab State ---
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [replyToComment, setReplyToComment] = useState<CommentResponse | null>(null);
  const [newCommentContent, setNewCommentContent] = useState("");

  const { data: postsData, isLoading: isPostsLoading } = useGetPublicPostsQuery({
    page: 0,
    size: 50,
  });
  const posts = postsData?.list || [];

  const { data: commentsData, isLoading: isCommentsLoading } = useGetPostCommentsQuery(
    { postId: selectedPostId!, page: 0, size: 100 },
    { skip: !selectedPostId }
  );
  const comments = commentsData || [];

  const [publishComment, { isLoading: isPublishing }] = usePublishCommentMutation();

  const handlePublishSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPostId || !newCommentContent.trim()) return;

    try {
      await publishComment({
        content: newCommentContent.trim(),
        postId: selectedPostId,
        parentId: replyToComment ? replyToComment.id : undefined,
      }).unwrap();

      setNewCommentContent("");
      setReplyToComment(null);
    } catch {
      // Handled globally
    }
  };

  // --- Admin Tab State ---
  const [adminSort, setAdminSort] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });
  const [commentToDelete, setCommentToDelete] = useState<CommentResponse | null>(null);
  const [adminFilter, setAdminFilter] = useState<"all" | "pending">("all");

  const allCommentsResult = useGetAdminCommentsQuery(
    { page: 0, size: 50 },
    { skip: adminFilter !== "all" }
  );
  const pendingCommentsResult = useGetPendingCommentsQuery(
    { page: 0, size: 50 },
    { skip: adminFilter !== "pending" }
  );

  const adminCommentsData =
    adminFilter === "all" ? allCommentsResult.data : pendingCommentsResult.data;
  const isAdminCommentsLoading =
    adminFilter === "all" ? allCommentsResult.isLoading : pendingCommentsResult.isLoading;

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
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Comment Management</h1>
        <p className="text-muted mt-1 text-sm">
          Test interface for public threading and administrative moderation.
        </p>
      </div>

      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Comment views">
            <Tabs.Tab id="public">
              Public View
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="admin">
              Admin Moderation
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
            placeholder={isPostsLoading ? "Loading posts..." : "Select a Post to view comments"}
            isDisabled={isPostsLoading}
            value={selectedPostId?.toString() || null}
            onChange={(val) => {
              if (val) {
                setSelectedPostId(Number(val));
                setReplyToComment(null); // reset reply state
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
            <div className="bg-surface border-border rounded-3xl border p-6 md:p-8">
              <CommentSystem postId={selectedPostId} />
            </div>
          )}
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === "admin" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={
                adminFilter === "all"
                  ? "bg-default-100 text-foreground font-semibold"
                  : "text-default-400"
              }
              onPress={() => setAdminFilter("all")}
            >
              All Comments
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={
                adminFilter === "pending"
                  ? "bg-default-100 text-foreground font-semibold"
                  : "text-default-400"
              }
              onPress={() => setAdminFilter("pending")}
            >
              Pending Approval
            </Button>
          </div>

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
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={!!commentToDelete}
          onOpenChange={(open) => !open && setCommentToDelete(null)}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Comment</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                Are you sure you want to permanently delete this comment? This action cannot be
                undone.
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

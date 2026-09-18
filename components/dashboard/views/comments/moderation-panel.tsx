"use client";

import {
  AlertDialog,
  Avatar,
  AvatarFallback,
  Button,
  Chip,
  Dropdown,
  Label,
  ListBox,
  SearchField,
  Select,
  Separator,
  Spinner,
  Switch,
  Tooltip,
} from "@heroui/react";
import {
  ActionBar,
  DataGrid,
  type DataGridColumn,
  type DataGridSelection,
  type DataGridSortDescriptor,
} from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCallback, useMemo, useState } from "react";

import {
  type CommentResponse,
  type CommentStatus,
  useBatchModerateCommentsMutation,
  useDeleteCommentMutation,
  useFeatureCommentMutation,
  useGetAdminCommentsQuery,
  useModerateCommentMutation,
  usePinCommentMutation,
} from "@/lib/features/comment";
import { useGetPublicPostsQuery } from "@/lib/features/post";
import { CommentStatusChip } from "./status-chip";

type StatusFilter = "all" | CommentStatus;

export function CommentModerationPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [postFilter, setPostFilter] = useState<number | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<DataGridSelection>(new Set());
  const [commentToDelete, setCommentToDelete] = useState<CommentResponse | null>(null);
  const [adminSort, setAdminSort] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  const { data: postsData } = useGetPublicPostsQuery({ page: 0, size: 50 });
  const posts = postsData?.list ?? [];

  const {
    data: adminCommentsData,
    isLoading: isAdminCommentsLoading,
    isFetching,
  } = useGetAdminCommentsQuery({
    page,
    size: 20,
    status: statusFilter === "all" ? undefined : statusFilter,
    postId: postFilter ?? undefined,
    featuredOnly: featuredOnly || undefined,
    keyword: keyword.trim() || undefined,
  });

  const [moderateComment] = useModerateCommentMutation();
  const [batchModerate, { isLoading: isBatching }] = useBatchModerateCommentsMutation();
  const [pinComment] = usePinCommentMutation();
  const [featureComment] = useFeatureCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();

  const sortedComments = useMemo(() => {
    const list = adminCommentsData?.list ?? [];
    const col = adminSort.column as keyof CommentResponse;
    return [...list].sort((a, b) => {
      const first = a[col] ?? "";
      const second = b[col] ?? "";
      const cmp =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second));
      return adminSort.direction === "descending" ? -cmp : cmp;
    });
  }, [adminSort, adminCommentsData?.list]);

  const totalPages = Math.max(1, adminCommentsData?.totalPages ?? 1);

  const selectedIds = useMemo(() => {
    if (selectedKeys === "all") {
      return new Set(sortedComments.map((comment) => comment.id));
    }
    return new Set(
      [...selectedKeys]
        .map((key) => Number(key))
        .filter((id) => Number.isInteger(id) && sortedComments.some((comment) => comment.id === id))
    );
  }, [selectedKeys, sortedComments]);

  const handleModerate = useCallback(
    async (id: number, status: CommentStatus) => {
      await moderateComment({ id, status });
    },
    [moderateComment]
  );

  const handleBatch = useCallback(
    async (status: CommentStatus) => {
      if (selectedIds.size === 0) return;
      await batchModerate({ ids: [...selectedIds], status });
      setSelectedKeys(new Set());
    },
    [batchModerate, selectedIds]
  );

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;
    await deleteComment(commentToDelete.id);
    setCommentToDelete(null);
    setSelectedKeys(new Set());
  };

  const columns = useMemo<DataGridColumn<CommentResponse>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        id: "id",
        minWidth: 72,
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
        minWidth: 240,
        cell: (item) => (
          <div className="flex flex-col gap-1">
            <span className="line-clamp-2 text-sm">{item.content}</span>
            {item.postTitle ? (
              <span className="text-muted line-clamp-1 text-xs">{item.postTitle}</span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        id: "status",
        minWidth: 110,
        cell: (item) => <CommentStatusChip status={item.status} />,
      },
      {
        header: "Flags",
        id: "flags",
        minWidth: 140,
        cell: (item) => (
          <div className="flex flex-wrap gap-1">
            {item.pinned ? (
              <Chip size="sm" variant="soft" color="accent">
                Pinned
              </Chip>
            ) : null}
            {item.featured ? (
              <Chip size="sm" variant="soft" color="warning">
                Featured
              </Chip>
            ) : null}
            {(item.reportsCount ?? 0) > 0 ? (
              <Chip size="sm" variant="soft" color="danger">
                {item.reportsCount} reports
              </Chip>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        header: "Created",
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
        minWidth: 320,
        pinned: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="tertiary"
              className="text-success"
              onPress={() => handleModerate(item.id, "APPROVED")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              className="text-danger"
              onPress={() => handleModerate(item.id, "REJECTED")}
            >
              Reject
            </Button>
            <Dropdown>
              <Button isIconOnly size="sm" variant="ghost" aria-label="More moderation actions">
                <Icon icon="gravity-ui:ellipsis" className="size-4" />
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => {
                    const action = String(key);
                    if (action === "spam") void handleModerate(item.id, "SPAM");
                    if (action === "pin") void pinComment({ id: item.id, pinned: !item.pinned });
                    if (action === "feature")
                      void featureComment({ id: item.id, featured: !item.featured });
                    if (action === "delete") setCommentToDelete(item);
                  }}
                >
                  <Dropdown.Item id="spam" textValue="Mark as spam">
                    <Label>Mark as spam</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="pin" textValue={item.pinned ? "Unpin" : "Pin"}>
                    <Label>{item.pinned ? "Unpin" : "Pin"}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="feature" textValue={item.featured ? "Unfeature" : "Feature"}>
                    <Label>{item.featured ? "Unfeature" : "Feature"}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                    <Label>Delete</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        ),
      },
    ],
    [featureComment, handleModerate, pinComment]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <SearchField
            className="w-full sm:w-[220px]"
            name="comment-keyword"
            value={keyword}
            onChange={(value) => {
              setPage(0);
              setKeyword(value);
            }}
          >
            <Label>Keyword</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search content" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <Select
            className="w-full sm:w-[180px]"
            value={statusFilter}
            onChange={(value) => {
              setPage(0);
              setStatusFilter((value as StatusFilter) || "all");
            }}
          >
            <Label>Status</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {(
                  [
                    ["all", "All statuses"],
                    ["PENDING", "Pending"],
                    ["APPROVED", "Approved"],
                    ["REJECTED", "Rejected"],
                    ["SPAM", "Spam"],
                  ] as const
                ).map(([id, label]) => (
                  <ListBox.Item key={id} id={id} textValue={label}>
                    {label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="w-full sm:w-[260px]"
            placeholder="All posts"
            value={postFilter?.toString() ?? "all"}
            onChange={(value) => {
              setPage(0);
              setPostFilter(value && value !== "all" ? Number(value) : null);
            }}
          >
            <Label>Post</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="All posts">
                  All posts
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {posts.map((post) => (
                  <ListBox.Item key={post.id} id={post.id.toString()} textValue={post.title}>
                    {post.title}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Switch
            isSelected={featuredOnly}
            onChange={(value) => {
              setPage(0);
              setFeaturedOnly(value);
            }}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <span className="text-sm font-medium">Featured only</span>
            </Switch.Content>
          </Switch>
        </div>

        <Chip size="sm" variant="soft">
          {adminCommentsData?.total ?? sortedComments.length} total · page {page + 1}/{totalPages}
        </Chip>
      </div>

      <ActionBar aria-label="Bulk comment actions" isOpen={selectedIds.size > 0}>
        <ActionBar.Prefix>
          <Chip className="shrink-0 tabular-nums" size="sm">
            {selectedIds.size}
          </Chip>
        </ActionBar.Prefix>
        <Separator />
        <ActionBar.Content>
          <Button
            size="sm"
            variant="ghost"
            isPending={isBatching}
            onPress={() => handleBatch("APPROVED")}
          >
            <span className="action-bar__label">Approve</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isPending={isBatching}
            onPress={() => handleBatch("REJECTED")}
          >
            <span className="action-bar__label">Reject</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-danger bg-danger/10"
            isPending={isBatching}
            onPress={() => handleBatch("SPAM")}
          >
            <span className="action-bar__label">Mark spam</span>
          </Button>
        </ActionBar.Content>
        <Separator />
        <ActionBar.Suffix>
          <Tooltip>
            <Button
              isIconOnly
              aria-label="Clear selection"
              size="sm"
              variant="ghost"
              onPress={() => setSelectedKeys(new Set())}
            >
              <Icon icon="gravity-ui:xmark" className="size-4" />
            </Button>
            <Tooltip.Content>Clear selection</Tooltip.Content>
          </Tooltip>
        </ActionBar.Suffix>
      </ActionBar>

      <div className="bg-surface border-border overflow-hidden rounded-2xl border">
        <DataGrid
          showSelectionCheckboxes
          aria-label="Admin comments"
          columns={columns}
          contentClassName="min-w-[1100px]"
          data={sortedComments}
          getRowId={(item) => item.id}
          isLoadingMore={isAdminCommentsLoading || isFetching}
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          sortDescriptor={adminSort}
          onSelectionChange={setSelectedKeys}
          onSortChange={setAdminSort}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={page <= 0}
          onPress={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={page + 1 >= totalPages}
          onPress={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={!!commentToDelete}
          onOpenChange={(open) => !open && setCommentToDelete(null)}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md" aria-label="Delete comment">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete comment?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                Permanently delete this comment from the public timeline. This cannot be undone.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setCommentToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="danger" isDisabled={isDeleting} onPress={handleDeleteConfirm}>
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
